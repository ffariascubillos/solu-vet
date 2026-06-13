import express from "express";
import cors from "cors";
import path from "node:path";
import { router } from "./routes/index.js";
import { errorHandler } from "./middlewares/error-handler.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.resolve("uploads")));
app.use("/api", router);

app.use(errorHandler);
