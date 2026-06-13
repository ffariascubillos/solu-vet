import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { deleteLocalFile } from "../../utils/file.js";
import {
  createConsultationSchema,
  updateConsultationSchema,
} from "./consultations.schemas.js";

export async function createConsultation(req: Request, res: Response) {
  const data = createConsultationSchema.parse(req.body);

  const patientExists = await prisma.patient.findUnique({
    where: { id: data.patientId },
  });

  if (!patientExists) {
    return res.status(404).json({
      ok: false,
      message: "Patient not found",
    });
  }

  const consultation = await prisma.consultation.create({
    data: {
      patientId: data.patientId,
      remoteAnamnesis: data.remoteAnamnesis,
      consultationReason: data.consultationReason,
      currentAnamnesis: data.currentAnamnesis,
      clinicalExam: data.clinicalExam,
      diagnosis: data.diagnosis,
      inClinicTreatment: data.inClinicTreatment,
      complementaryTests: data.complementaryTests,
      testResults: data.testResults,
      consultationDate: data.consultationDate,

      homeTreatment: data.homeTreatment
        ? {
            create: {
              instructions: data.homeTreatment.instructions,
            },
          }
        : undefined,

      followUps: data.followUps?.length
        ? {
            create: data.followUps.map((item) => ({
              date: item.date,
            })),
          }
        : undefined,

      consultationDetail: data.consultationDetail
        ? {
            create: {
              cost: data.consultationDetail.cost,
              notes: data.consultationDetail.notes,
            },
          }
        : undefined,

      vaccineRecords: data.vaccineRecords?.length
        ? {
            create: data.vaccineRecords.map((item) => ({
              date: item.date,
              vaccineName: item.vaccineName,
            })),
          }
        : undefined,

      attachments: data.attachments?.length
        ? {
            create: data.attachments.map((item) => ({
              fileName: item.fileName,
              fileUrl: item.fileUrl,
              mimeType: item.mimeType,
              fileSize: item.fileSize,
            })),
          }
        : undefined,
    },
    include: {
      patient: true,
      homeTreatment: true,
      followUps: true,
      consultationDetail: true,
      vaccineRecords: true,
      attachments: true,
    },
  });

  return res.status(201).json({
    ok: true,
    data: consultation,
  });
}

export async function getConsultations(_req: Request, res: Response) {
  const consultations = await prisma.consultation.findMany({
    include: {
      patient: {
        include: {
          tutor: true,
        },
      },
      homeTreatment: true,
      followUps: true,
      consultationDetail: true,
      vaccineRecords: true,
      attachments: true,
    },
    orderBy: {
      consultationDate: "desc",
    },
  });

  return res.json({
    ok: true,
    data: consultations,
  });
}

export async function getConsultationById(req: Request, res: Response) {
  const id = String(req.params.id);

  const consultation = await prisma.consultation.findUnique({
    where: { id },
    include: {
      patient: {
        include: {
          tutor: true,
        },
      },
      homeTreatment: true,
      followUps: true,
      consultationDetail: true,
      vaccineRecords: true,
      attachments: true,
    },
  });

  if (!consultation) {
    return res.status(404).json({
      ok: false,
      message: "Consultation not found",
    });
  }

  return res.json({
    ok: true,
    data: consultation,
  });
}

export async function getConsultationsByPatient(req: Request, res: Response) {
  const patientId = String(req.params.patientId);

  const consultations = await prisma.consultation.findMany({
    where: { patientId },
    include: {
      homeTreatment: true,
      followUps: true,
      consultationDetail: true,
      vaccineRecords: true,
      attachments: true,
    },
    orderBy: {
      consultationDate: "desc",
    },
  });

  return res.json({
    ok: true,
    data: consultations,
  });
}

export async function updateConsultation(req: Request, res: Response) {
  const id = String(req.params.id);
  const data = updateConsultationSchema.parse(req.body);

  const existing = await prisma.consultation.findUnique({
    where: { id },
    include: {
      homeTreatment: true,
      consultationDetail: true,
    },
  });

  if (!existing) {
    return res.status(404).json({
      ok: false,
      message: "Consultation not found",
    });
  }

  const updated = await prisma.consultation.update({
    where: { id },
    data: {
      remoteAnamnesis: data.remoteAnamnesis,
      consultationReason: data.consultationReason,
      currentAnamnesis: data.currentAnamnesis,
      clinicalExam: data.clinicalExam,
      diagnosis: data.diagnosis,
      inClinicTreatment: data.inClinicTreatment,
      complementaryTests: data.complementaryTests,
      testResults: data.testResults,
      consultationDate: data.consultationDate,

      homeTreatment: data.homeTreatment
        ? existing.homeTreatment
          ? {
              update: {
                instructions: data.homeTreatment.instructions,
              },
            }
          : {
              create: {
                instructions: data.homeTreatment.instructions,
              },
            }
        : undefined,

      consultationDetail: data.consultationDetail
        ? existing.consultationDetail
          ? {
              update: {
                cost: data.consultationDetail.cost,
                notes: data.consultationDetail.notes,
              },
            }
          : {
              create: {
                cost: data.consultationDetail.cost,
                notes: data.consultationDetail.notes,
              },
            }
        : undefined,
    },
    include: {
      patient: true,
      homeTreatment: true,
      followUps: true,
      consultationDetail: true,
      vaccineRecords: true,
      attachments: true,
    },
  });

  return res.json({
    ok: true,
    data: updated,
  });
}

export async function deleteConsultation(req: Request, res: Response) {
  const id = String(req.params.id);

  const existing = await prisma.consultation.findUnique({
    where: { id },
    include: {
      attachments: true,
    },
  });

  if (!existing) {
    return res.status(404).json({
      ok: false,
      message: "Consultation not found",
    });
  }

  for (const attachment of existing.attachments) {
    deleteLocalFile(attachment.fileUrl);
  }

  await prisma.consultation.delete({
    where: { id },
  });

  return res.json({
    ok: true,
    message: "Consultation deleted successfully",
  });
}

export async function uploadConsultationAttachment(
  req: Request,
  res: Response,
) {
  const consultationId = String(req.params.id);

  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
  });

  if (!consultation) {
    return res.status(404).json({
      ok: false,
      message: "Consultation not found",
    });
  }

  if (!req.file) {
    return res.status(400).json({
      ok: false,
      message: "File is required",
    });
  }

  const attachment = await prisma.attachment.create({
    data: {
      consultationId,
      fileName: req.file.originalname,
      fileUrl: `/uploads/${req.file.filename}`,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
    },
  });

  return res.status(201).json({
    ok: true,
    data: attachment,
  });
}

export async function deleteAttachment(req: Request, res: Response) {
  const id = String(req.params.attachmentId);

  const attachment = await prisma.attachment.findUnique({
    where: { id },
  });

  if (!attachment) {
    return res.status(404).json({
      ok: false,
      message: "Attachment not found",
    });
  }

  deleteLocalFile(attachment.fileUrl);

  await prisma.attachment.delete({
    where: { id },
  });

  return res.json({
    ok: true,
    message: "Attachment deleted successfully",
  });
}
