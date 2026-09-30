import { randomBytes } from "node:crypto"
import type { Request, Response } from "express"
import { prisma } from "../../lib/prisma.js"
import { hashToken } from "../../lib/auth/hash-token.js"
import {
  ACTIVATION_TOKEN_TTL_MS,
  pendingInvitationWhere,
} from "../../lib/auth/invitation-token.js"
import { USER_LIMIT_BY_ORGANIZATION_TYPE } from "../../lib/organization-limits.js"
import { emailSender } from "../../lib/email/resend-email-sender.js"
import { APP_URL } from "../../lib/env.js"
import { inviteUserSchema } from "./users.schemas.js"

export async function inviteUser(req: Request, res: Response) {
  const data = inviteUserSchema.parse(req.body)
  const organizationId = req.auth!.organizationId

  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
  })

  if (organization.type === "INDEPENDENT") {
    return res.status(403).json({
      ok: false,
      message: "Las cuentas de veterinario independiente no pueden invitar usuarios.",
    })
  }

  const limit = USER_LIMIT_BY_ORGANIZATION_TYPE[organization.type]
  const token = randomBytes(32).toString("hex")

  const conflict = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Organization" WHERE id = ${organizationId} FOR UPDATE`

    if (await tx.user.findUnique({ where: { email: data.email } })) {
      return { message: "Ya existe una cuenta con este correo.", field: "email" }
    }

    if (
      await tx.userInvitation.findFirst({
        where: { email: data.email, ...pendingInvitationWhere() },
      })
    ) {
      return { message: "Ya hay una invitación pendiente para este correo.", field: "email" }
    }

    const seatsUsed =
      (await tx.user.count({ where: { organizationId } })) +
      (await tx.userInvitation.count({
        where: { organizationId, ...pendingInvitationWhere() },
      }))

    if (seatsUsed >= limit) {
      return { message: `La clínica alcanzó el límite de ${limit} usuarios.` }
    }

    await tx.userInvitation.create({
      data: {
        email: data.email,
        organizationId,
        role: data.role,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + ACTIVATION_TOKEN_TTL_MS),
        invitedByUserId: req.auth!.userId,
      },
    })

    return null
  })

  if (conflict) {
    return res.status(409).json({ ok: false, ...conflict })
  }

  const activationUrl = `${APP_URL}/activate?token=${token}`
  try {
    await emailSender.sendActivationEmail(data.email, activationUrl)
  } catch (error) {
    console.error("Failed to send activation email", error)
  }

  return res.status(201).json({ ok: true })
}

export async function getSeats(req: Request, res: Response) {
  const organizationId = req.auth!.organizationId

  const [organization, users, invitations] = await Promise.all([
    prisma.organization.findUniqueOrThrow({ where: { id: organizationId } }),
    prisma.user.findMany({
      where: { organizationId },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.userInvitation.findMany({
      where: { organizationId, ...pendingInvitationWhere() },
      orderBy: { createdAt: "asc" },
    }),
  ])

  return res.status(200).json({
    ok: true,
    data: {
      limit: USER_LIMIT_BY_ORGANIZATION_TYPE[organization.type],
      seats: [
        ...users.map((user) => ({
          id: user.id,
          kind: "USER",
          name: user.name,
          email: user.email,
          role: user.role,
          status: "ACTIVE",
        })),
        ...invitations.map((invitation) => ({
          id: invitation.id,
          kind: "INVITATION",
          name: null,
          email: invitation.email,
          role: invitation.role,
          status: "PENDING",
        })),
      ],
    },
  })
}

export async function cancelInvitation(req: Request, res: Response) {
  const invitation = await prisma.userInvitation.findFirst({
    where: {
      id: String(req.params.id),
      organizationId: req.auth!.organizationId,
      ...pendingInvitationWhere(),
    },
  })

  if (!invitation) {
    return res.status(404).json({ ok: false, message: "No se encontró la invitación." })
  }

  await prisma.userInvitation.delete({ where: { id: invitation.id } })

  return res.status(200).json({ ok: true })
}

export async function removeUser(req: Request, res: Response) {
  const id = String(req.params.id)

  if (id === req.auth!.userId) {
    return res.status(400).json({ ok: false, message: "No puedes darte de baja a ti mismo." })
  }

  const user = await prisma.user.findFirst({
    where: { id, organizationId: req.auth!.organizationId },
  })

  if (!user) {
    return res.status(404).json({ ok: false, message: "No se encontró el usuario." })
  }

  await prisma.$transaction([
    prisma.refreshToken.deleteMany({ where: { userId: id } }),
    prisma.passwordResetToken.deleteMany({ where: { userId: id } }),
    prisma.userInvitation.deleteMany({ where: { invitedByUserId: id } }),
    prisma.user.delete({ where: { id } }),
  ])

  return res.status(200).json({ ok: true })
}
