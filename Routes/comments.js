
import express from "express";
import pool from "../db.js"; // your PostgreSQL connection

const router = express.Router();

router.post("/add", async (req, res) => {
  const { itemid, userid, comment } = req.body;

  try {
    // Validate required fields
    if (!itemid || !userid || !comment) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // INSERT into your table
    const result = await pool.query(
      `INSERT INTO comments (itemid, userid, comment, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [itemid, userid, comment]
    );

    res.status(200).json({
      message: "Comment added successfully",
      comment: result.rows[0],
    });
  } catch (error) {
    console.error("Error inserting comment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/list/:itemid", async (req, res) => {
  const { itemid } = req.params;

  try {
   const result = await pool.query(
  `SELECT 
      c.id,
      c.comment,
      c.userid,
      c.created_at,
      u.fullname,
      u.nationalrole, u.executiverole, u.districtrole, u.assemblyrole AS role,
      ch.name AS churchname
   FROM comments c
   JOIN users u ON u.id = c.userid
   JOIN churches ch ON u.churchid = ch.id
   WHERE c.itemid = $1
   ORDER BY c.created_at ASC`,
  [itemid]
);


    res.json(result.rows);
  } catch (err) {
    console.error("Fetch comments error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


router.put("/comments/update/:id", async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;

  try {
    if (!comment) {
      return res.status(400).json({ error: "Comment text required" });
    }

    const result = await pool.query(
      `UPDATE comments 
       SET comment = $1 
       WHERE id = $2
       RETURNING *`,
      [comment, id]
    );

    res.json({
      message: "Comment updated",
      comment: result.rows[0],
    });
  } catch (err) {
    console.error("Update comment error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/comments/delete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM comments WHERE id = $1", [id]);

    res.json({ message: "Comment deleted" });
  } catch (err) {
    console.error("Delete comment error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
