import express from "express";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.post(
  "/create",
  upload.fields([
    { name: "documentFile", maxCount: 1 },
    { name: "audioFile", maxCount: 1 },
    { name: "carouselImages", maxCount: 10 }
  ]),
  async (req, res) => {
    try {
      console.log("Body:", req.body);
      console.log("Files:", req.files);

      // save to DB, S3, etc...

      res.json({ success: true, message: "Uploaded successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

export default router;
