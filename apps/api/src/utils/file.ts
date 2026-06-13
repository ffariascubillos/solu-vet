import fs from "node:fs";
import path from "node:path";

export function deleteLocalFile(fileUrl: string) {
  const cleanPath = fileUrl.startsWith("/") ? fileUrl.slice(1) : fileUrl;
  const absolutePath = path.resolve(cleanPath);

  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
}
