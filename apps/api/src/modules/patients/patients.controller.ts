import type { Request, Response } from "express"
import { prisma } from "../../lib/prisma.js"
import { createPatientSchema } from "./patients.schemas.js"

export async function createPatient(req: Request, res: Response) {
  const data = createPatientSchema.parse(req.body)

  const tutorExists = await prisma.tutor.findUnique({
    where: { id: data.tutorId },
  })

  if (!tutorExists) {
    return res.status(404).json({
      ok: false,
      message: "Tutor not found",
    })
  }

  const patient = await prisma.patient.create({
    data,
  })

  return res.status(201).json({
    ok: true,
    data: patient,
  })
}

export async function getPatients(_req: Request, res: Response) {
  const patients = await prisma.patient.findMany({
    include: {
      tutor: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return res.json({
    ok: true,
    data: patients,
  })
}

export async function searchPatients(req: Request, res: Response) {
  const q = String(req.query.q || "").trim()

  if (!q) {
    return res.status(400).json({
      ok: false,
      message: "Query parameter q is required",
    })
  }

  const patients = await prisma.patient.findMany({
    where: {
      OR: [
        {
          firstName: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          lastName: {
            contains: q,
            mode: "insensitive",
          },
        },
      ],
    },
    include: {
      tutor: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return res.json({
    ok: true,
    data: patients,
  })
}

export async function getPatientById(req: Request, res: Response) {
  const id = String(req.params.id)

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      tutor: true,
      consultations: {
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
      },
    },
  })

  if (!patient) {
    return res.status(404).json({
      ok: false,
      message: "Patient not found",
    })
  }

  return res.json({
    ok: true,
    data: patient,
  })
}
