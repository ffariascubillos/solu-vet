import { randomUUID } from "node:crypto"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { prisma } from "../prisma.js"
import { hashToken } from "./hash-token.js"
import {
  PasswordResetTokenError,
  consumePasswordResetToken,
  issuePasswordResetToken,
} from "./password-reset-token.js"

describe("password reset token lifecycle", () => {
  let organizationId: string
  let userId: string

  beforeAll(async () => {
    const organization = await prisma.organization.create({
      data: {
        name: "Password Reset Test Org",
        type: "INDEPENDENT",
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })
    organizationId = organization.id

    const user = await prisma.user.create({
      data: {
        email: `password-reset-${randomUUID()}@example.com`,
        passwordHash: "irrelevant-for-this-test",
        role: "OWNER",
        organizationId,
      },
    })
    userId = user.id
  })

  afterAll(async () => {
    await prisma.passwordResetToken.deleteMany({ where: { userId } })
    await prisma.user.delete({ where: { id: userId } })
    await prisma.organization.delete({ where: { id: organizationId } })
  })

  it("issues a token that can be consumed for the owning user", async () => {
    const token = await issuePasswordResetToken(userId)

    const result = await consumePasswordResetToken(token)

    expect(result.userId).toBe(userId)
  })

  it("rejects reusing an already-used token", async () => {
    const token = await issuePasswordResetToken(userId)
    await consumePasswordResetToken(token)

    await expect(consumePasswordResetToken(token)).rejects.toThrow(
      PasswordResetTokenError,
    )
  })

  it("rejects an unknown token", async () => {
    await expect(
      consumePasswordResetToken("not-a-real-token"),
    ).rejects.toThrow(PasswordResetTokenError)
  })

  it("rejects an expired token", async () => {
    const token = `expired-${randomUUID()}`
    await prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() - 1000),
      },
    })

    await expect(consumePasswordResetToken(token)).rejects.toThrow(
      PasswordResetTokenError,
    )
  })
})
