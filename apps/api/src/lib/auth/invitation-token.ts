import { prisma } from "../prisma.js"
import { hashToken } from "./hash-token.js"

export const ACTIVATION_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

export class InvitationTokenError extends Error {}

export function pendingInvitationWhere() {
  return { acceptedAt: null, expiresAt: { gt: new Date() } }
}

export async function activateInvitation(
  presentedToken: string,
  passwordHash: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.userInvitation.findFirst({
      where: { tokenHash: hashToken(presentedToken) },
    })

    if (!existing) {
      throw new InvitationTokenError("Invalid invitation token")
    }
    if (existing.acceptedAt) {
      throw new InvitationTokenError("Invitation token already used")
    }
    if (existing.expiresAt < new Date()) {
      throw new InvitationTokenError("Invitation token expired")
    }

    const existingUser = await tx.user.findUnique({ where: { email: existing.email } })
    if (existingUser) {
      throw new InvitationTokenError("Email already registered")
    }

    await tx.userInvitation.update({
      where: { id: existing.id },
      data: { acceptedAt: new Date() },
    })

    await tx.user.create({
      data: {
        email: existing.email,
        role: existing.role,
        organizationId: existing.organizationId,
        name: null,
        passwordHash,
      },
    })
  })
}
