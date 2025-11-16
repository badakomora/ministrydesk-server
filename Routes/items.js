// server/routes/items.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const router = express.Router();

// ⭐ Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ⭐ Create uploads folder if it doesn't exist
const UPLOAD_FOLDER = path.join(__dirname, "../uploads");
if (!fs.existsSync(UPLOAD_FOLDER)) {
  fs.mkdirSync(UPLOAD_FOLDER, { recursive: true });
}

// ⭐ Multer disk storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_FOLDER);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ⭐ POST /items/create
router.post(
  "/create",
  upload.fields([
    { name: "documentFile", maxCount: 1 },
    { name: "audioFile", maxCount: 1 },
    { name: "carouselImages", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      // Extract form fields
      const {
        churchid,
        userid,
        category,
        department,
        title,
        datePosted,
        description,
        showDownload,
        showComment,
        showContribution,
        showDonation,
      } = req.body;

      // Extract files
      const documentFile = req.files?.documentFile?.[0] || null;
      const audioFile = req.files?.audioFile?.[0] || null;
      const carouselImages = req.files?.carouselImages || [];

      // Log for debug
      console.log("Church ID:", churchid);
      console.log("User ID:", userid);
      console.log("Category:", category);
      console.log("Document file path:", documentFile?.path);
      console.log("Audio file path:", audioFile?.path);
      console.log("Carousel images paths:", carouselImages.map(f => f.path));

      // TODO: Insert into your DB here
      // Example: await db.insertItem({ churchid, userid, category, ... });

      res.json({ success: true, message: "Uploaded successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

export default router;
