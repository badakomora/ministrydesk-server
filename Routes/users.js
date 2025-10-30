import express from "express";
import pool from "../db.js";  // adjust path to your db connection

const router = express.Router();

router.post("/signup", async (req, res) => {
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

export default router;
