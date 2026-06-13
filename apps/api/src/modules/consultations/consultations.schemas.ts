import { z } from "zod";

const homeTreatmentSchema = z.object({
  instructions: z.string().min(1),
});

const followUpSchema = z.object({
  date: z.coerce.date(),
});

const consultationDetailSchema = z.object({
  cost: z.coerce.number().nonnegative(),
  notes: z.string().optional(),
});

const vaccineRecordSchema = z.object({
  date: z.coerce.date(),
  vaccineName: z.string().min(1),
});

const attachmentSchema = z.object({
  fileName: z.string().min(1),
  fileUrl: z.string().min(1),
  mimeType: z.string().optional(),
  fileSize: z.number().int().nonnegative().optional(),
});

export const createConsultationSchema = z.object({
  patientId: z.string().min(1),
  remoteAnamnesis: z.string().optional(),
  consultationReason: z.string().min(1),
  currentAnamnesis: z.string().optional(),
  clinicalExam: z.string().optional(),
  diagnosis: z.string().optional(),
  inClinicTreatment: z.string().optional(),
  complementaryTests: z.string().optional(),
  testResults: z.string().optional(),
  consultationDate: z.coerce.date().optional(),

  homeTreatment: homeTreatmentSchema.optional(),
  followUps: z.array(followUpSchema).optional(),
  consultationDetail: consultationDetailSchema.optional(),
  vaccineRecords: z.array(vaccineRecordSchema).optional(),
  attachments: z.array(attachmentSchema).optional(),
});

export const updateConsultationSchema = z.object({
  remoteAnamnesis: z.string().optional(),
  consultationReason: z.string().min(1).optional(),
  currentAnamnesis: z.string().optional(),
  clinicalExam: z.string().optional(),
  diagnosis: z.string().optional(),
  inClinicTreatment: z.string().optional(),
  complementaryTests: z.string().optional(),
  testResults: z.string().optional(),
  consultationDate: z.coerce.date().optional(),

  homeTreatment: homeTreatmentSchema.optional(),
  consultationDetail: consultationDetailSchema.optional(),
});

export type CreateConsultationInput = z.infer<typeof createConsultationSchema>;
export type UpdateConsultationInput = z.infer<typeof updateConsultationSchema>;
