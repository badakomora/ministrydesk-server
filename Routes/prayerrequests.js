import express from "express";
import pool from "../db.js"; // adjust path to match your structure

const router = express.Router();

router.post("/new", async (req, res) => {
  try {
    const { idnumber, description } = req.body;

    if (!idnumber || !description) {
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
      `INSERT INTO prayerrequests (userid, description) 
       VALUES ($1, $2) 
       RETURNING *`,
      [userid, description ]
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

router.get("/prayerrequests", async (req, res) => {
  try {
   const result = await pool.query(
  `SELECT 
      prayerrequests.id,
      prayerrequests.userid,
      users.fullname,
      prayerrequests.description,
      prayerrequests.status,
      prayerrequests.created_at
   FROM prayerrequests
   INNER JOIN users ON prayerrequests.userid = users.id
   ORDER BY prayerrequests.created_at DESC`
);


    res.status(200).json( result.rows);

  } catch (error) {
    console.error("Error fetching prayer requests:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching prayer requests",
    });
  }
});
export default router;
