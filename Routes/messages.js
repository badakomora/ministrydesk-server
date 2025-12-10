import express from "express";
import pool from "../db.js"; // adjust path to match your structure

const router = express.Router();

router.post("/new", async (req, res) => {
  try {
    const { name, phone, message } = req.body;

    if (!name || !phone || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Insert into DB
    const result = await pool.query(
      `INSERT INTO messages (name, phone, message) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [name, phone, message]
    );

    res.status(200).json({
      message: "Message received and saved successfully!",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error saving message:", error);
    res.status(500).json({ error: "Server error, please try again." });
  }
});

router.get("/messages", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, phone, message, status, created_at 
       FROM messages
       ORDER BY created_at DESC`
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
