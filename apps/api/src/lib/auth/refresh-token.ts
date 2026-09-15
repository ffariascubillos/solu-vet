import { randomBytes } from "node:crypto"
import { prisma } from "../prisma.js"
import { hashToken } from "./hash-token.js"
import type { UserRole } from "../../generated/prisma/client.js"

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000

export class RefreshTokenError extends Error {}

function generateToken(): string {
  return randomBytes(32).toString("hex")
}

export async function issueRefreshToken(userId: string): Promise<string> {
  const token = generateToken()

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  })

  return token
}

async function revokeChainFrom(replacedByTokenId: string | null): Promise<void> {
  let nextId = replacedByTokenId

  while (nextId) {
    const next = await prisma.refreshToken.findUnique({ where: { id: nextId } })
    if (!next) break

    if (!next.revokedAt) {
      await prisma.refreshToken.update({
        where: { id: next.id },
        data: { revokedAt: new Date() },
      })
    }

    nextId = next.replacedByTokenId
  }
}

export async function rotateRefreshToken(presentedToken: string): Promise<{
  token: string
  userId: string
  organizationId: string
  role: UserRole
}> {
  const existing = await prisma.refreshToken.findFirst({
    where: { tokenHash: hashToken(presentedToken) },
  })

  if (!existing) {
    throw new RefreshTokenError("Invalid refresh token")
  }

  if (existing.revokedAt) {
    await revokeChainFrom(existing.replacedByTokenId)
    throw new RefreshTokenError("Refresh token reuse detected")
  }

  if (existing.expiresAt < new Date()) {
    throw new RefreshTokenError("Refresh token expired")
  }

  const user = await prisma.user.findUnique({ where: { id: existing.userId } })
  if (!user) {
    throw new RefreshTokenError("User not found")
  }

  const newToken = generateToken()
  const newRow = await prisma.refreshToken.create({
    data: {
      userId: existing.userId,
      tokenHash: hashToken(newToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  })

  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date(), replacedByTokenId: newRow.id },
  })

  return {
    token: newToken,
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role,
  }
}

export async function revokeRefreshToken(presentedToken: string): Promise<void> {
  const existing = await prisma.refreshToken.findFirst({
    where: { tokenHash: hashToken(presentedToken) },
  })

  if (existing && !existing.revokedAt) {
    await prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    })
  }
}

export async function revokeAllRefreshTokensForUser(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}
