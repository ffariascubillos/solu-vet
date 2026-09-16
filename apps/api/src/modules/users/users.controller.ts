import { randomBytes } from "node:crypto"
import type { Request, Response } from "express"
import { prisma } from "../../lib/prisma.js"
import { hashPassword } from "../../lib/auth/password.js"
import { hashToken } from "../../lib/auth/hash-token.js"
import { ACTIVATION_TOKEN_TTL_MS } from "../../lib/auth/invitation-token.js"
import { emailSender } from "../../lib/email/resend-email-sender.js"
import { APP_URL } from "../../lib/env.js"
import { inviteUserSchema } from "./users.schemas.js"

export async function inviteUser(req: Request, res: Response) {
  const data = inviteUserSchema.parse(req.body)

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  })

  if (existingUser) {
    return res.status(409).json({
      ok: false,
      message: "Ya existe una cuenta con este correo.",
      field: "email",
    })
  }

  const token = randomBytes(32).toString("hex")

  await prisma.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        email: data.email,
        role: data.role,
        organizationId: req.auth!.organizationId,
        passwordHash: await hashPassword(randomBytes(32).toString("hex")),
      },
    })

    await tx.userInvitation.create({
      data: {
        email: data.email,
        organizationId: req.auth!.organizationId,
        role: data.role,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + ACTIVATION_TOKEN_TTL_MS),
        invitedByUserId: req.auth!.userId,
      },
    })
  })

  const activationUrl = `${APP_URL}/activate?token=${token}`
  try {
    await emailSender.sendActivationEmail(data.email, activationUrl)
  } catch (error) {
    console.error("Failed to send activation email", error)
  }

  return res.status(201).json({ ok: true })
}
