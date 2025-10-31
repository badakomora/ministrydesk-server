import express from "express";
import pool from "../db.js"; // your PostgreSQL connection

const router = express.Router();

// ---------------------------
// Register a new church
// ---------------------------
router.post("/register", async (req, res) => {
  const { name, description, categoryid, location, phone, email } = req.body;

  if (!name || !categoryid) {
    return res.status(400).json({ message: "Name and category are required." });
  }

  try {
    // 🧠 1. Check if a church with the same name (case-insensitive) already exists
    const check = await pool.query(
      "SELECT id, name FROM churches WHERE LOWER(name) = LOWER($1)",
      [name.trim()]
    );

    if (check.rows.length > 0) {
      // Duplicate found — return it instead of inserting again
      return res.status(409).json({
        message: "Church already exists.",
        existingChurch: check.rows[0],
      });
    }

    // 🧱 2. If no duplicate, insert new church
    const result = await pool.query(
      `INSERT INTO churches (name, description, categoryid, location, phone, email, datecreated)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, name`,
      [name.trim(), description || "", categoryid, location || "", phone || "", email || ""]
    );
    return res.status(201).json({
      message: "Church created successfully.",
      Church: result.rows[0]
    });
  } catch (error) {
    console.error("Error inserting church:", error);
    res.status(500).json({ message: "Server error while registering church." });
  }
});


// ---------------------------
// Get all churches
// ---------------------------
router.get("/list", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name FROM churches ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching churches:", error);
    res.status(500).json({ message: "Server error while fetching churches." });
  }
});



export default router;
