import express from "express";
import pool from "../db.js";  // adjust path to your db connection

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const {
      idnumber,
      fullname,
      phonenumber,
      email,
      role,
      churchid, // use churchid from frontend
    } = req.body;

    // 1) Validate required fields
    if (!fullname || !phonenumber || !churchid) {
      return res.status(400).json({
        error: "Full name, phone number, and church selection are required",
      });
    }

    // 2) Check duplicates
    const existing = await pool.query(
      `SELECT * FROM users WHERE idnumber = $1 OR phonenumber = $2 OR email = $3`,
      [idnumber || null, phonenumber, email || null]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: "User with same ID number, phone, or email already exists",
      });
    }

    // 3) Insert user
    const result = await pool.query(
      `
      INSERT INTO users (idnumber, fullname, phonenumber, email, role, churchid)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
      `,
      [idnumber, fullname, phonenumber, email, role, churchid] // <-- corrected
    );

    return res.status(201).json({
      message: "User registered successfully",
      user: result.rows[0],
    });

  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});



// ---------- LOGIN (Step 1: Verify phone and send OTP) ----------
router.post("/login", async (req, res) => {
  try {
    const { phonenumber } = req.body;

    if (!phonenumber) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    // 1️⃣ Check if phone exists
    const user = await pool.query(
  `SELECT fullname, phonenumber, role, email, churchid, idnumber, subscription, datecreated 
   FROM users WHERE phonenumber = $1`,
  [phonenumber]
);


    if (user.rows.length === 0) {
      return res.status(404).json({ error: "Phone number not registered" });
    }

    const { idnumber,fullname,email, role, churchid, subscription,datecreated } = user.rows[0];

    // 2️⃣ Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP

    // 3️⃣ Save OTP in DB
    await pool.query(
      `UPDATE users SET otp = $1, otpexpiry = NOW() + INTERVAL '5 minutes' WHERE phonenumber = $2`,
      [otp, phonenumber]
    );

    // 4️⃣ Send back response
    return res.json({
      message: "OTP sent successfully",
      otp,
      idnumber,
      fullname,
      phonenumber,
      email,
      role,
      churchid,
      subscription,
      datecreated
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});


// ---------- VERIFY OTP (Step 2: User enters OTP) ----------
router.post("/verifyotp", async (req, res) => {
  try {
    const { phonenumber, otp } = req.body;

    if (!phonenumber || !otp) {
      return res.status(400).json({ error: "Phone and OTP are required" });
    }

    const result = await pool.query(
      `SELECT * FROM users WHERE phonenumber = $1 AND otp = $2 AND otpexpiry > NOW()`,
      [phonenumber, otp]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Optional: clear OTP after successful verification
    await pool.query(
      `UPDATE users SET otp = NULL, otpexpiry = NULL WHERE phonenumber = $1`,
      [phonenumber]
    );

    return res.json({
      message: "Login successful",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("OTP verification error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});


router.post("/list", async (req, res) => {
  try {
    const {churchid} = req.body
    const query = `
      SELECT * FROM users 
      WHERE churchid = $1
      ORDER BY id DESC
    `;

    const result = await pool.query(query, [churchid]);
    res.json(result.rows); // return list as array
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error fetching users" });
  }
});
export default router;
