import type { Request, Response } from "express"
import { prisma } from "../../lib/prisma.js"
import { createTutorSchema } from "./tutors.schemas.js"

export async function createTutor(req: Request, res: Response) {
  const data = createTutorSchema.parse(req.body)

  const existingTutorByRut = await prisma.tutor.findUnique({
    where: { rut: data.rut },
  })

  if (existingTutorByRut) {
    return res.status(409).json({
      ok: false,
      message: "Ya existe un tutor con este RUT.",
      field: "rut",
    })
  }

  if (data.email) {
    const existingTutorByEmail = await prisma.tutor.findUnique({
      where: { email: data.email },
    })

    if (existingTutorByEmail) {
      return res.status(409).json({
        ok: false,
        message: "Ya existe un tutor con este correo.",
        field: "email",
      })
    }
  }

  const tutor = await prisma.tutor.create({
    data,
  })

  return res.status(201).json({
    ok: true,
    data: tutor,
  })
}

export async function getTutors(_req: Request, res: Response) {
  const tutors = await prisma.tutor.findMany({
    orderBy: {
      createdAt: "desc",
    },
  })

  return res.json({
    ok: true,
    data: tutors,
  })
}

export async function searchTutors(req: Request, res: Response) {
  const q = String(req.query.q || "").trim()

  if (!q) {
    return res.status(400).json({
      ok: false,
      message: "Query parameter q is required",
    })
  }

  const tutors = await prisma.tutor.findMany({
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
        {
          rut: {
            contains: q,
            mode: "insensitive",
          },
        },
      ],
    },
    include: {
      patients: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return res.json({
    ok: true,
    data: tutors,
  })
}

export async function getTutorById(req: Request, res: Response) {
  const id = String(req.params.id)

  const tutor = await prisma.tutor.findUnique({
    where: { id },
    include: {
      patients: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  })

  if (!tutor) {
    return res.status(404).json({
      ok: false,
      message: "Tutor not found",
    })
  }

  return res.json({
    ok: true,
    data: tutor,
  })
}
