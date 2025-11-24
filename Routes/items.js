// server/routes/items.js
import express from "express";
import multer from "multer";
import pool from "../db.js"; // your PostgreSQL connection
import path from "path";
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()
const UPLOAD_FOLDER = path.join(__dirname, "../uploads")
// ⭐ Multer disk storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_FOLDER)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({ storage: storage }) // Initialize multer with the storage configuration

const getFileServerUrl = (filename, folder = "uploads") => {
  const serverUrl = "http://localhost:4000"
  return `${serverUrl}/${folder}/${filename}`
}
router.post(
  "/create",
  upload.fields([
    { name: "documentFile", maxCount: 1 },
    { name: "audioFile", maxCount: 1 },
    { name: "carouselImages", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const {
        churchid,
        userid,
        category,
        department,
        title,
        datePosted,
        description,
        offerTithes = 0,
        offerDonations = 0,
        requestSpecialPrayers = 0,
        contributeOffering = 0,
        verses = [] // <-- expecting array of titles
      } = req.body;

      const documentFile = req.files?.documentFile?.[0] || null;
      const audioFile = req.files?.audioFile?.[0] || null;
      const carouselImages = req.files?.carouselImages || [];

      const documentFileName = documentFile?.filename || null;
      const audioFileName = audioFile?.filename || null;
      const documentUrl = documentFile
        ? getFileServerUrl(documentFileName, "uploads")
        : null;
      const audioUrl = audioFile
        ? getFileServerUrl(audioFileName, "uploads")
        : null;

      // Convert offer fields to numbers
      const offerTithesNum = Number(offerTithes) || 0;
      const offerDonationsNum = Number(offerDonations) || 0;
      const requestSpecialPrayersNum = Number(requestSpecialPrayers) || 0;
      const contributeOfferingNum = Number(contributeOffering) || 0;

      // Ensure verses is an array
      const versesArray = Array.isArray(verses) ? verses : [verses];

      // Insert item
      const inserted = await pool.query(
        `INSERT INTO items 
          (churchid, userid, category, department, title, datePosted, description,
           documentFile, audioFile, offerTithes, offerDonations, requestSpecialPrayers, contributeOffering, verses)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         RETURNING id`,
        [
          churchid,
          userid,
          category,
          department,
          title,
          datePosted,
          description,
          documentUrl,
          audioUrl,
          offerTithesNum,
          offerDonationsNum,
          requestSpecialPrayersNum,
          contributeOfferingNum,
          versesArray,
        ]
      );

      const itemId = inserted.rows[0].id;
      console.log("Saved item id:", itemId);

      // Insert carousel images
      for (const img of carouselImages) {
        const imageUrl = getFileServerUrl(img.filename, "uploads");
        await pool.query(
          `INSERT INTO carouselfiles (itemid, filepath)
           VALUES ($1, $2)`,
          [itemId, imageUrl]
        );
      }

      res.json({ success: true, message: "Uploaded successfully", itemId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);


router.get("/itemlist/:userid", async (req, res) => {
  try {
    const { userid } = req.params;
    const items = await pool.query(
      `SELECT 
      items.*  FROM items
      WHERE items.userid = $1;`, [userid]
    );

    res.json(items.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


router.get("/list", async (req, res) => {
  try {
    const items = await pool.query(
    `SELECT 
    i.*, 
    u.fullname AS postedBy,
    ch.name AS churchName,
    COALESCE(json_agg(c.filepath) FILTER (WHERE c.filepath IS NOT NULL), '[]') AS carouselImages
    FROM items i
    LEFT JOIN users u ON u.id = i.userid
    LEFT JOIN churches ch ON ch.id = i.churchid
    LEFT JOIN carouselfiles c ON c.itemid = i.id
    GROUP BY i.id, u.fullname, ch.name
    ORDER BY i.id DESC;`);

    res.json(items.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/list/:itemid", async (req, res) => {
  try {
    const { itemid } = req.params
    const items = await pool.query(
      `SELECT 
  i.*,
  u.fullname AS postedby,
  ch.name AS churchName,
  COALESCE(json_agg(c.filepath) FILTER (WHERE c.filepath IS NOT NULL), '[]') AS carouselImages
FROM items i
LEFT JOIN users u ON u.id = i.userid
LEFT JOIN churches ch ON ch.id = i.churchid
LEFT JOIN carouselfiles c ON c.itemid = i.id
WHERE i.id = $1
GROUP BY i.id, u.fullname, ch.name
ORDER BY i.id DESC;

`,
      [itemid],
    )
    res.json(items.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
})


export default router;
