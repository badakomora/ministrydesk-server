import express from "express";
import pool from "../db.js"; // your database connection

const router = express.Router();

// POST /transaction/deposit
router.post("/deposit", async (req, res) => {
  try {
    let { idnumber, phone, amount, activity } = req.body;

    // Validate required fields
    if (!phone || !amount || !activity) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let userid;

    if (idnumber) {
      const userResult = await pool.query(
        "SELECT id FROM users WHERE idnumber = $1",
        [idnumber]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "User with provided ID number not found" });
      }

      userid = userResult.rows[0].id;
    }
    const transactionResult = await pool.query(
      `INSERT INTO accounts (userid, phone, amount, activity, timestamp)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [userid, phone, amount, activity]
    );

    return res.status(200).json({
      message: "Transaction recorded successfully",
      transaction: transactionResult.rows[0],
    });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
