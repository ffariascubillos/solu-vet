import { Router } from "express";
import { uploadSingleAttachment } from "../../middlewares/upload.js";
import {
  createConsultation,
  deleteAttachment,
  deleteConsultation,
  getConsultationById,
  getConsultations,
  getConsultationsByPatient,
  updateConsultation,
  uploadConsultationAttachment,
} from "./consultations.controller.js";

export const consultationsRouter = Router();

consultationsRouter.post("/", createConsultation);
consultationsRouter.get("/", getConsultations);
consultationsRouter.get("/patient/:patientId", getConsultationsByPatient);
consultationsRouter.get("/:id", getConsultationById);

consultationsRouter.patch("/:id", updateConsultation);
consultationsRouter.delete("/:id", deleteConsultation);

consultationsRouter.post(
  "/:id/attachments",
  uploadSingleAttachment,
  uploadConsultationAttachment,
);
consultationsRouter.delete("/attachments/:attachmentId", deleteAttachment);
