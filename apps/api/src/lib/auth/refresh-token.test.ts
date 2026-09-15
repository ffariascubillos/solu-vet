import { randomUUID } from "node:crypto"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { prisma } from "../prisma.js"
import { hashToken } from "./hash-token.js"
import {
  RefreshTokenError,
  issueRefreshToken,
  revokeAllRefreshTokensForUser,
  revokeRefreshToken,
  rotateRefreshToken,
} from "./refresh-token.js"

describe("refresh token lifecycle", () => {
  let organizationId: string
  let userId: string

  beforeAll(async () => {
    const organization = await prisma.organization.create({
      data: {
        name: "Refresh Token Test Org",
        type: "INDEPENDENT",
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })
    organizationId = organization.id

    const user = await prisma.user.create({
      data: {
        email: `refresh-token-${randomUUID()}@example.com`,
        passwordHash: "irrelevant-for-this-test",
        role: "OWNER",
        organizationId,
      },
    })
    userId = user.id
  })

  afterAll(async () => {
    await prisma.refreshToken.deleteMany({ where: { userId } })
    await prisma.user.delete({ where: { id: userId } })
    await prisma.organization.delete({ where: { id: organizationId } })
  })

  it("rotates a valid refresh token and returns the owning user's data", async () => {
    const token = await issueRefreshToken(userId)

    const result = await rotateRefreshToken(token)

    expect(result.userId).toBe(userId)
    expect(result.organizationId).toBe(organizationId)
    expect(result.role).toBe("OWNER")
    expect(result.token).not.toBe(token)
  })

  it("revokes the whole token lineage when a rotated token is reused", async () => {
    const tokenA = await issueRefreshToken(userId)
    const { token: tokenB } = await rotateRefreshToken(tokenA)

    await expect(rotateRefreshToken(tokenA)).rejects.toThrow(RefreshTokenError)
    await expect(rotateRefreshToken(tokenB)).rejects.toThrow(RefreshTokenError)
  })

  it("rejects rotating an unknown token", async () => {
    await expect(rotateRefreshToken("not-a-real-token")).rejects.toThrow(
      RefreshTokenError,
    )
  })

  it("rejects rotating an expired token", async () => {
    const token = `expired-${randomUUID()}`
    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() - 1000),
      },
    })

    await expect(rotateRefreshToken(token)).rejects.toThrow(RefreshTokenError)
  })

  it("rejects reusing a token after it has been explicitly revoked", async () => {
    const token = await issueRefreshToken(userId)
    await revokeRefreshToken(token)

    await expect(rotateRefreshToken(token)).rejects.toThrow(RefreshTokenError)
  })

  it("revokes every active refresh token for a user", async () => {
    const tokenA = await issueRefreshToken(userId)
    const tokenB = await issueRefreshToken(userId)

    await revokeAllRefreshTokensForUser(userId)

    await expect(rotateRefreshToken(tokenA)).rejects.toThrow(RefreshTokenError)
    await expect(rotateRefreshToken(tokenB)).rejects.toThrow(RefreshTokenError)
  })
})
