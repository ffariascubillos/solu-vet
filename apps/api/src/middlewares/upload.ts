import { upload } from "../config/multer.js";

export const uploadSingleAttachment = upload.single("file");
