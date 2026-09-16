import type { Request, Response } from "express"
import { prisma } from "../../lib/prisma.js"
import { createTutorSchema, updateTutorSchema } from "./tutors.schemas.js"

export async function createTutor(req: Request, res: Response) {
  const data = createTutorSchema.parse(req.body)
  const organizationId = req.auth!.organizationId

  const existingTutorByRut = await prisma.tutor.findUnique({
    where: { rut_organizationId: { rut: data.rut, organizationId } },
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
      where: { email_organizationId: { email: data.email, organizationId } },
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
    data: { ...data, organizationId },
  })

  return res.status(201).json({
    ok: true,
    data: tutor,
  })
}

export async function updateTutor(req: Request, res: Response) {
  const id = String(req.params.id)
  const data = updateTutorSchema.parse(req.body)
  const organizationId = req.auth!.organizationId

  const existingTutor = await req.prisma!.tutor.findFirst({ where: { id } })
  if (!existingTutor) {
    return res.status(404).json({
      ok: false,
      message: "Tutor not found",
    })
  }

  const tutorWithSameRut = await prisma.tutor.findUnique({
    where: { rut_organizationId: { rut: data.rut, organizationId } },
  })

  if (tutorWithSameRut && tutorWithSameRut.id !== id) {
    return res.status(409).json({
      ok: false,
      message: "Ya existe un tutor con este RUT.",
      field: "rut",
    })
  }

  if (data.email) {
    const tutorWithSameEmail = await prisma.tutor.findUnique({
      where: { email_organizationId: { email: data.email, organizationId } },
    })

    if (tutorWithSameEmail && tutorWithSameEmail.id !== id) {
      return res.status(409).json({
        ok: false,
        message: "Ya existe un tutor con este correo.",
        field: "email",
      })
    }
  }

  const tutor = await prisma.tutor.update({
    where: { id },
    data,
  })

  return res.status(200).json({
    ok: true,
    data: tutor,
  })
}

export async function getTutors(req: Request, res: Response) {
  const tutors = await req.prisma!.tutor.findMany({
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

  const tutors = await req.prisma!.tutor.findMany({
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
        include: {
          species: true,
          breed: true,
        },
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

  const tutor = await req.prisma!.tutor.findFirst({
    where: { id },
    include: {
      patients: {
        include: {
          species: true,
          breed: true,
        },
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
