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

  const speciesExists = await prisma.species.findUnique({
    where: { id: data.speciesId },
  })

  if (!speciesExists) {
    return res.status(404).json({
      ok: false,
      message: "Species not found",
    })
  }

  const breed = await prisma.breed.findUnique({
    where: { id: data.breedId },
  })

  if (!breed) {
    return res.status(404).json({
      ok: false,
      message: "Breed not found",
    })
  }

  if (breed.speciesId !== data.speciesId) {
    return res.status(400).json({
      ok: false,
      message: "Breed does not match patient species",
      field: "breedId",
    })
  }

  const patient = await prisma.patient.create({
    data,
    include: {
      species: true,
      breed: true,
    },
  })

  return res.status(201).json({
    ok: true,
    data: patient,
  })
}

export async function updatePatient(req: Request, res: Response) {
  const id = String(req.params.id)
  const data = createPatientSchema.parse(req.body)

  const existingPatient = await prisma.patient.findUnique({ where: { id } })
  if (!existingPatient) {
    return res.status(404).json({
      ok: false,
      message: "Patient not found",
    })
  }

  const tutorExists = await prisma.tutor.findUnique({
    where: { id: data.tutorId },
  })

  if (!tutorExists) {
    return res.status(404).json({
      ok: false,
      message: "Tutor not found",
    })
  }

  const speciesExists = await prisma.species.findUnique({
    where: { id: data.speciesId },
  })

  if (!speciesExists) {
    return res.status(404).json({
      ok: false,
      message: "Species not found",
    })
  }

  const breed = await prisma.breed.findUnique({
    where: { id: data.breedId },
  })

  if (!breed) {
    return res.status(404).json({
      ok: false,
      message: "Breed not found",
    })
  }

  if (breed.speciesId !== data.speciesId) {
    return res.status(400).json({
      ok: false,
      message: "Breed does not match patient species",
      field: "breedId",
    })
  }

  const patient = await prisma.patient.update({
    where: { id },
    data,
    include: {
      species: true,
      breed: true,
    },
  })

  return res.json({
    ok: true,
    data: patient,
  })
}

export async function getPatients(_req: Request, res: Response) {
  const patients = await prisma.patient.findMany({
    include: {
      tutor: true,
      species: true,
      breed: true,
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
      species: true,
      breed: true,
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
      species: true,
      breed: true,
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
