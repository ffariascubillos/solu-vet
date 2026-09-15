import { randomBytes } from "node:crypto"
import { prisma } from "../prisma.js"
import { hashToken } from "./hash-token.js"

// 1 hour: long enough to receive and open the email, short enough to limit exposure if intercepted.
const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000

export class PasswordResetTokenError extends Error {}

export async function issuePasswordResetToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex")

  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS),
    },
  })

  return token
}

export async function consumePasswordResetToken(
  presentedToken: string,
): Promise<{ userId: string }> {
  const existing = await prisma.passwordResetToken.findFirst({
    where: { tokenHash: hashToken(presentedToken) },
  })

  if (!existing) {
    throw new PasswordResetTokenError("Invalid password reset token")
  }

  if (existing.usedAt) {
    throw new PasswordResetTokenError("Password reset token already used")
  }

  if (existing.expiresAt < new Date()) {
    throw new PasswordResetTokenError("Password reset token expired")
  }

  await prisma.passwordResetToken.update({
    where: { id: existing.id },
    data: { usedAt: new Date() },
  })

  return { userId: existing.userId }
}
