import express from "express";
import pool from "../db.js";
import axios from "axios";
import generateToken from "../mpesa/generateToken.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const MPESA_BASE_URL = process.env.BASE_URL;
const MPESA_SHORTCODE = process.env.SHORTCODE;
const PASSKEY = process.env.PASSKEY; // STK Push passkey
const PUBLIC_URL = process.env.PUBLIC_URL; // Ngrok URL or live domain

// ----------------------
// Helpers
// ----------------------
const getMpesaTimestamp = () => {
  const now = new Date();
  const yyyy = now.getFullYear().toString();
  const mm = (now.getMonth() + 1).toString().padStart(2, "0");
  const dd = now.getDate().toString().padStart(2, "0");
  const hh = now.getHours().toString().padStart(2, "0");
  const min = now.getMinutes().toString().padStart(2, "0");
  const ss = now.getSeconds().toString().padStart(2, "0");
  return `${yyyy}${mm}${dd}${hh}${min}${ss}`;
};

// Normalize phone to 2547XXXXXXXX
const normalizePhone = (phone) => {
  let p = phone.trim();
  if (p.startsWith("0")) return "254" + p.substring(1);
  if (p.startsWith("+254")) return p.substring(1);
  if (p.startsWith("254")) return p;
  throw new Error("Invalid phone number format");
};

// ----------------------
// /deposit Endpoint
// ----------------------
router.post("/deposit", generateToken, async (req, res) => {
  try {
    const { idnumber, phone, amount, activity, itemid } = req.body;

    if (!phone || !amount || !activity) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const customerPhone = normalizePhone(phone);

    // Find user ID if idnumber is provided
    let userid = null;
    if (idnumber) {
      const userResult = await pool.query(
        "SELECT id FROM users WHERE idnumber = $1",
        [idnumber]
      );
      if (!userResult.rows.length) {
        return res.status(404).json({ error: "User not found" });
      }
      userid = userResult.rows[0].id;
    }

    // Save transaction as PENDING
    const transactionResult = await pool.query(
      `INSERT INTO accounts 
        (userid, phone, amount, activity, itemid, timestamp, status)
       VALUES ($1, $2, $3, $4, $5, NOW(), 'PENDING')
       RETURNING *`,
      [userid, customerPhone, amount, activity, itemid || null]
    );

    const txId = transactionResult.rows[0].id;
    const txRef = `TXN${txId}`;
    const mpesaTimestamp = getMpesaTimestamp();
    const password = Buffer.from(`${MPESA_SHORTCODE}${PASSKEY}${mpesaTimestamp}`).toString("base64");

    // STK Push payload
    const stkPayload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: mpesaTimestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: customerPhone,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: customerPhone,
      CallBackURL: `${PUBLIC_URL}/transaction/callback`,
      AccountReference: txRef,
      TransactionDesc: "Payment for goods",
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

    // Store CheckoutRequestID in DB
    await pool.query(
      `UPDATE accounts
       SET checkoutrequestid = $1
       WHERE id = $2`,
      [mpesaRes.data.CheckoutRequestID, txId]
    );

    return res.status(200).json({
      message: "STK Push initiated successfully",
      transaction: transactionResult.rows[0],
      mpesaResponse: mpesaRes.data,
      txRef,
    });
  } catch (error) {
    console.error("Deposit error:", error?.response?.data || error.message);
    return res.status(500).json({
      error: "Transaction failed",
      details: error?.response?.data || error.message,
    });
  }
});

// ----------------------
// /callback Endpoint
// ----------------------
router.post("/callback", async (req, res) => {
  try {
    const callback = req.body?.Body?.stkCallback;

    if (!callback) {
      console.error("stkCallback not found!", req.body);
      return res.json({ ResultCode: 1, ResultDesc: "No callback found" });
    }

    // Respond to M-Pesa immediately
    res.json({ ResultCode: 0, ResultDesc: "Accepted" });

    if (callback.ResultCode !== 0) {
      console.log("Transaction failed:", callback.ResultDesc);
      return;
    }

    const metadata = callback.CallbackMetadata?.Item || [];
    const mpesaReceipt = metadata.find(i => i.Name === "MpesaReceiptNumber")?.Value;
    const phone = normalizePhone(metadata.find(i => i.Name === "PhoneNumber")?.Value || "");
    const amount = metadata.find(i => i.Name === "Amount")?.Value;
    const checkoutId = callback.CheckoutRequestID;

    console.log("STK Callback received:", { checkoutId, mpesaReceipt, phone, amount });

    const txResult = await pool.query(
      `SELECT id, userid, activity 
       FROM accounts 
       WHERE checkoutrequestid = $1`,
      [checkoutId]
    );

    if (!txResult.rows.length) {
      console.error("Transaction not found in DB for checkoutId:", checkoutId);
      return;
    }

    const { id, userid, activity } = txResult.rows[0];

    // Update transaction as SUCCESS
    await pool.query(
      `UPDATE accounts
       SET mpesaref = $1,
           status = 'SUCCESS'
       WHERE id = $2`,
      [mpesaReceipt, id]
    );

    // Handle subscription if applicable
    if (activity === "Subscription" && userid) {
      await pool.query(
        `UPDATE users 
         SET subscription = true 
         WHERE id = $1`,
        [userid]
      );
    }

    console.log("Transaction updated successfully for checkoutId:", checkoutId);
  } catch (err) {
    console.error("STK Callback error:", err);
  }
});

export default router;
