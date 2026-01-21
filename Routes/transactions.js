import express from "express";
import pool from "../db.js";
import axios from "axios";
import generateToken from "../mpesa/generateToken.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const MPESA_BASE_URL = process.env.BASE_URL;
const MPESA_SHORTCODE = process.env.SHORTCODE;
const PASSKEY = process.env.PASSKEY;
const PUBLIC_URL = process.env.PUBLIC_URL;

// ----------------------------------
// Helpers
// ----------------------------------
const getMpesaTimestamp = () => {
  const now = new Date();
  return (
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0")
  );
};

const normalizePhone = (phone) => {
  if (!phone) return null;
  let p = phone.toString().trim();
  if (p.startsWith("0")) return "254" + p.substring(1);
  if (p.startsWith("+254")) return p.substring(1);
  if (p.startsWith("254")) return p;
  throw new Error("Invalid phone format");
};

// ----------------------------------
// POST /deposit
// ----------------------------------
router.post("/deposit", generateToken, async (req, res) => {
  try {
    const { idnumber, phone, amount, activity, itemid } = req.body;

    if (!phone || !amount || !activity) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const customerPhone = normalizePhone(phone);

    // Find user
    let userid = null;
    if (idnumber) {
      const userRes = await pool.query(
        "SELECT id FROM users WHERE idnumber = $1",
        [idnumber]
      );
      if (!userRes.rows.length) {
        return res.status(404).json({ error: "User not found" });
      }
      userid = userRes.rows[0].id;
    }

    // Save as PENDING
    const txRes = await pool.query(
      `INSERT INTO accounts
       (userid, phone, amount, activity, itemid, status, timestamp)
       VALUES ($1, $2, $3, $4, $5, 'PENDING', NOW())
       RETURNING id`,
      [userid, customerPhone, amount, activity, itemid || null]
    );

    const txId = txRes.rows[0].id;
    const accountRef = `TXN${txId}`;
    const timestamp = getMpesaTimestamp();
    const password = Buffer.from(
      `${MPESA_SHORTCODE}${PASSKEY}${timestamp}`
    ).toString("base64");

    const stkPayload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: customerPhone,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: customerPhone,
      CallBackURL: `${PUBLIC_URL}/transaction/callback`,
      AccountReference: accountRef,
      TransactionDesc: "Payment",
    };

    const mpesaRes = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      stkPayload,
      {
        headers: {
          Authorization: `Bearer ${req.mpesaToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    await pool.query(
      `UPDATE accounts
       SET checkoutrequestid = $1
       WHERE id = $2`,
      [mpesaRes.data.CheckoutRequestID, txId]
    );

    res.json({
      message: "STK Push sent",
      checkoutId: mpesaRes.data.CheckoutRequestID,
    });
  } catch (err) {
    console.error("Deposit error:", err?.response?.data || err.message);
    res.status(500).json({ error: "STK push failed" });
  }
});

// ----------------------------------
// POST /callback
// ----------------------------------
router.post("/callback", async (req, res) => {
  const callback = req.body?.Body?.stkCallback;

  // Always acknowledge M-Pesa
  res.json({ ResultCode: 0, ResultDesc: "Accepted" });

  if (!callback) return;

  const checkoutId = callback.CheckoutRequestID;

  try {
    // ❌ FAILED
    if (callback.ResultCode !== 0) {
      await pool.query(
        `UPDATE accounts
         SET status = 'FAILED',
             failreason = $1
         WHERE checkoutrequestid = $2`,
        [callback.ResultDesc, checkoutId]
      );
      return;
    }

    // ✅ SUCCESS
    const metadata = callback.CallbackMetadata?.Item || [];
    const receipt = metadata.find(i => i.Name === "MpesaReceiptNumber")?.Value;

    const txRes = await pool.query(
      `SELECT id, userid, activity
       FROM accounts
       WHERE checkoutrequestid = $1
       FOR UPDATE`,
      [checkoutId]
    );

    if (!txRes.rows.length) return;

    const { id, userid, activity } = txRes.rows[0];

    await pool.query(
      `UPDATE accounts
       SET status = 'SUCCESS',
           mpesaref = $1
       WHERE id = $2`,
      [receipt, id]
    );

    // Handle subscription
    if (activity === "Subscription" && userid) {
      await pool.query(
        `UPDATE users
         SET subscription = 1
         WHERE id = $1`,
        [userid]
      );
    }

    console.log("Payment success:", checkoutId);
  } catch (err) {
    console.error("Callback processing error:", err);
  }
});

export default router;
