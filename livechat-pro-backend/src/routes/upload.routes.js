import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import env from "../config/env.js";
import { uploadFiles } from "../controllers/upload.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();

const uploadDir = path.resolve(process.cwd(), env.fileUploadDir);
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
    cb(null, safeName);
  }
});

const upload = multer({ storage });

router.post("/", protect, upload.array("files", 10), uploadFiles);

export default router;
