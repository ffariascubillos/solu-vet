import multer from "multer";
import path from "node:path";
import fs from "node:fs";

const uploadDir = path.resolve("uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9-_]/g, "")
      .toLowerCase();

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/png"];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file type"));
    }

    cb(null, true);
  },
});
