import express from "express";
import pool from "../db.js"; // adjust path to match your structure

const router = express.Router();

router.post("/new", async (req, res) => {
  try {
    const { name, phone, message } = req.body;

    // Validate input
    if (!name || !phone || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // 1️⃣ Check if phone exists in `users` table
    const userCheck = await pool.query(
      `SELECT churchid FROM users WHERE phonenumber = $1 LIMIT 1`,
      [phone]
    );

    if (userCheck.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "User does not exist. Please register with us first." });
    }

    const churchid = userCheck.rows[0].churchid;

    // 2️⃣ Insert message only if user exists
    const result = await pool.query(
      `INSERT INTO messages (name, phone, message, churchid)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, phone, message, churchid]
    );

    return res.status(201).json({
      success: true,
      message: "Message submitted successfully.",
      data: result.rows[0],
    });

  } catch (error) {
    console.error("Error saving message:", error);
    return res.status(500).json({ error: "Server error, please try again." });
  }
});


router.post("/messages", async (req, res) => {
  try {
    const { churchid } = req.body;
    const result = await pool.query(
      `SELECT id, name, phone, message, status, churchid, created_at 
       FROM messages
       WHERE churchid = $1
       ORDER BY created_at DESC`, [churchid]
    );

    res.json(result.rows);

  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching messages",
    });
  }
});

export default router;
