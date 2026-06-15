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
