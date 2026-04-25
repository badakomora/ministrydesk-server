import express from "express";
import pool from "../db.js"; // your PostgreSQL connection

const router = express.Router();

// ---------------------------
// Register a new church
// ---------------------------
router.post("/register", async (req, res) => {
  const { name, description, categoryid, location, phone, email, pastor, regionid } = req.body;

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
      `INSERT INTO churches (name, description, categoryid, location, phone, email, pastor, regionid, datecreated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id, name`,
      [name.trim(), description || "", categoryid, location || "", phone || "", email || "", pastor || "", regionid || null]
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
    const result = await pool.query("SELECT * FROM churches ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching churches:", error);
    res.status(500).json({ message: "Server error while fetching churches." });
  }
});

router.get("/list/:regionid", async (req, res) => {
   const { regionid } = req.params;
  try {
    const result = await pool.query("SELECT * FROM churches WHERE regionid = $1 ORDER BY id ASC", [regionid]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching churches:", error);
    res.status(500).json({ message: "Server error while fetching churches." });
  }
});

// ✅ Get a single church by ID
router.post("/church", async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Church ID is required" });
  }

  try {
    const result = await pool.query(
      "SELECT name FROM churches WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Church not found" });
    }

    return res.json({
      message: "Church fetched successfully",
      church: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching church:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/mychurch/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "Church ID is required" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM churches WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Church not found" });
    }

    return res.json({
      message: "Church fetched successfully",
      church: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching church:", error);
    res.status(500).json({ message: "Server error" });
  }
});




export default router;
