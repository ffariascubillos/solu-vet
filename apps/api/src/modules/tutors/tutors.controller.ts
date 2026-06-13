import type { Request, Response } from "express"
import { prisma } from "../../lib/prisma.js"
import { createTutorSchema } from "./tutors.schemas.js"

export async function createTutor(req: Request, res: Response) {
  const data = createTutorSchema.parse(req.body)

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
