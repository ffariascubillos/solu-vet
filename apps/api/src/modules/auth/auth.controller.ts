import type { Request, Response } from "express"
import { prisma } from "../../lib/prisma.js"
import { hashPassword, verifyPassword } from "../../lib/auth/password.js"
import { signAccessToken } from "../../lib/auth/access-token.js"
import {
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokensForUser,
  RefreshTokenError,
} from "../../lib/auth/refresh-token.js"
import {
  issuePasswordResetToken,
  consumePasswordResetToken,
  PasswordResetTokenError,
} from "../../lib/auth/password-reset-token.js"
import { emailSender } from "../../lib/email/resend-email-sender.js"
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
} from "./auth.schemas.js"

if (!process.env.APP_URL) {
  throw new Error(
    "APP_URL no está definida. Configúrala en apps/api/.env antes de arrancar la API.",
  )
}

const APP_URL: string = process.env.APP_URL

export async function register(req: Request, res: Response) {
  const data = registerSchema.parse(req.body)

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

  const { user, organization } = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        type: data.organizationType,
        name: data.organizationType === "CLINIC" ? data.organizationName : data.name,
        trialEndsAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      },
    })

    const user = await tx.user.create({
      data: {
        email: data.email,
        passwordHash: await hashPassword(data.password),
        name: data.name,
        role: "OWNER",
        organizationId: organization.id,
      },
    })

    return { user, organization }
  })

  const accessToken = signAccessToken({
    sub: user.id,
    organizationId: organization.id,
    role: user.role,
  })
  const refreshToken = await issueRefreshToken(user.id)

  return res.status(201).json({
    ok: true,
    data: {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      organization: {
        id: organization.id,
        name: organization.name,
        type: organization.type,
        trialEndsAt: organization.trialEndsAt,
        subscriptionStatus: organization.subscriptionStatus,
      },
    },
  })
}

export async function login(req: Request, res: Response) {
  const data = loginSchema.parse(req.body)

  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: { organization: true },
  })

  if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
    return res.status(401).json({
      ok: false,
      message: "Correo o contraseña incorrectos.",
    })
  }

  const accessToken = signAccessToken({
    sub: user.id,
    organizationId: user.organizationId,
    role: user.role,
  })
  const refreshToken = await issueRefreshToken(user.id)

  return res.status(200).json({
    ok: true,
    data: {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        type: user.organization.type,
        trialEndsAt: user.organization.trialEndsAt,
        subscriptionStatus: user.organization.subscriptionStatus,
      },
    },
  })
}

export async function refresh(req: Request, res: Response) {
  const data = refreshSchema.parse(req.body)

  try {
    const result = await rotateRefreshToken(data.refreshToken)

    const accessToken = signAccessToken({
      sub: result.userId,
      organizationId: result.organizationId,
      role: result.role,
    })

    return res.status(200).json({
      ok: true,
      data: { accessToken, refreshToken: result.token },
    })
  } catch (error) {
    if (error instanceof RefreshTokenError) {
      return res.status(401).json({
        ok: false,
        message: "Refresh token inválido o expirado.",
      })
    }

    throw error
  }
}

export async function logout(req: Request, res: Response) {
  const data = logoutSchema.parse(req.body)

  await revokeRefreshToken(data.refreshToken)

  return res.status(200).json({ ok: true })
}

export async function logoutAll(req: Request, res: Response) {
  await revokeAllRefreshTokensForUser(req.auth!.userId)

  return res.status(200).json({ ok: true })
}

export async function requestPasswordReset(req: Request, res: Response) {
  const data = passwordResetRequestSchema.parse(req.body)

  const user = await prisma.user.findUnique({ where: { email: data.email } })

  if (user) {
    const token = await issuePasswordResetToken(user.id)
    const resetUrl = `${APP_URL}/reset-password?token=${token}`
    try {
      await emailSender.sendPasswordResetEmail(user.email, resetUrl)
    } catch (error) {
      console.error("Failed to send password reset email", error)
    }
  }

  return res.status(200).json({
    ok: true,
    message: "Si el correo está registrado, recibirás un enlace para recuperar tu contraseña.",
  })
}

export async function confirmPasswordReset(req: Request, res: Response) {
  const data = passwordResetConfirmSchema.parse(req.body)

  try {
    const { userId } = await consumePasswordResetToken(data.token)

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(data.newPassword) },
    })

    await revokeAllRefreshTokensForUser(userId)

    return res.status(200).json({ ok: true })
  } catch (error) {
    if (error instanceof PasswordResetTokenError) {
      return res.status(400).json({
        ok: false,
        message: "El enlace no es válido o ya expiró.",
      })
    }

    throw error
  }
}
