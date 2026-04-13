import express from "express";
import pool from "../db.js"; // adjust path to match your structure

const router = express.Router();

router.post("/new", async (req, res) => {
  try {
    const { idnumber, description, churchid } = req.body;

    if (!idnumber || !description || !churchid) {
      return res.status(400).json({ error: "All fields are required" });
    }

    let userid;

    if (idnumber) {
      const userResult = await pool.query(
        "SELECT id FROM users WHERE idnumber = $1",
        [idnumber]
      );

      userid = userResult.rows[0].id;
    }
     const result = await pool.query(
      `INSERT INTO prayerrequests (userid, description, churchid) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [userid, description, churchid ]
    );
      res.status(200).json({
      message: "Prayer Request received and saved successfully!",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error saving prayer request:", error);
    res.status(500).json({ error: "Server error, please try again." });
  }
});

router.post("/prayerrequests", async (req, res) => {
  try {
    const { churchid } = req.body;

    if (!churchid) {
      return res.status(400).json({ error: "churchid is required" });
    }

    const result = await pool.query(
      `SELECT 
        prayerrequests.id,
        prayerrequests.userid,
        prayerrequests.churchid,
        users.fullname,
        prayerrequests.description,
        prayerrequests.status,
        prayerrequests.created_at
      FROM prayerrequests
      INNER JOIN users ON prayerrequests.userid = users.id
      WHERE prayerrequests.churchid = $1
      ORDER BY prayerrequests.created_at DESC`,
      [churchid]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching prayer requests:", error);
    res.status(500).json({ error: "Server error while fetching prayer requests" });
  }
});



router.get("/requests/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const query = `
      SELECT 
        *
      FROM prayerrequests
      WHERE id = $1
    `;

    const result = await pool.query(query, [userId]);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching prayer requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prayer requests',
      error: error.message,
    });
  }
});



export default router;
