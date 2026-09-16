import { randomUUID } from "node:crypto"
import request from "supertest"
import { afterEach, describe, expect, it, vi } from "vitest"
import { app } from "../../app.js"
import { prisma } from "../../lib/prisma.js"
import { emailSender } from "../../lib/email/resend-email-sender.js"
import { APP_URL } from "../../lib/env.js"
import { signAccessToken } from "../../lib/auth/access-token.js"
import type { UserRole } from "../../generated/prisma/client.js"

const uniqueEmail = () => `users-test-${randomUUID()}@example.com`

const independentPayload = (overrides: Record<string, unknown> = {}) => ({
  organizationType: "INDEPENDENT",
  email: uniqueEmail(),
  password: "supersecret123",
  name: "Vet Owner",
  ...overrides,
})

async function cleanDatabase() {
  await prisma.userInvitation.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.passwordResetToken.deleteMany()
  await prisma.user.deleteMany()
  await prisma.organization.deleteMany()
}

async function registerOwner(overrides: Record<string, unknown> = {}) {
  const response = await request(app)
    .post("/api/auth/register")
    .send(independentPayload(overrides))

  return response.body.data as {
    accessToken: string
    refreshToken: string
    user: { id: string; email: string; name: string; role: string }
    organization: { id: string; name: string; type: string }
  }
}

describe("Users API", () => {
  afterEach(async () => {
    vi.restoreAllMocks()
    await cleanDatabase()
  })

  describe("POST /api/users/invite", () => {
    it("invites a new user as an authenticated OWNER: creates a pending User, a UserInvitation, and sends the activation email", async () => {
      const owner = await registerOwner()
      const emailSpy = vi
        .spyOn(emailSender, "sendActivationEmail")
        .mockResolvedValue(undefined)
      const invitedEmail = uniqueEmail()

      const response = await request(app)
        .post("/api/users/invite")
        .set("Authorization", `Bearer ${owner.accessToken}`)
        .send({ email: invitedEmail, role: "OWNER" })

      expect(response.status).toBe(201)
      expect(response.body).toMatchObject({ ok: true })

      const pendingUser = await prisma.user.findUniqueOrThrow({
        where: { email: invitedEmail },
      })
      expect(pendingUser.organizationId).toBe(owner.organization.id)
      expect(pendingUser.role).toBe("OWNER")

      const invitation = await prisma.userInvitation.findFirstOrThrow({
        where: { email: invitedEmail },
      })
      expect(invitation.organizationId).toBe(owner.organization.id)
      expect(invitation.invitedByUserId).toBe(owner.user.id)
      expect(invitation.acceptedAt).toBeNull()

      expect(emailSpy).toHaveBeenCalledTimes(1)
      const [calledEmail, activationUrl] = emailSpy.mock.calls[0] as [string, string]
      expect(calledEmail).toBe(invitedEmail)
      expect(activationUrl.startsWith(`${APP_URL}/activate?token=`)).toBe(true)
      expect(activationUrl).not.toMatch(/password/i)
    })

    it("returns 401 without an Authorization header and does not create rows or send an email", async () => {
      const emailSpy = vi
        .spyOn(emailSender, "sendActivationEmail")
        .mockResolvedValue(undefined)
      const invitedEmail = uniqueEmail()
      const userCountBefore = await prisma.user.count()
      const invitationCountBefore = await prisma.userInvitation.count()

      const response = await request(app)
        .post("/api/users/invite")
        .send({ email: invitedEmail, role: "OWNER" })

      expect(response.status).toBe(401)
      expect(await prisma.user.count()).toBe(userCountBefore)
      expect(await prisma.userInvitation.count()).toBe(invitationCountBefore)
      expect(emailSpy).not.toHaveBeenCalled()
    })

    it("returns 403 for an authenticated user with a role other than OWNER and does not create rows or send an email", async () => {
      const owner = await registerOwner()
      const staffAccessToken = signAccessToken({
        sub: owner.user.id,
        organizationId: owner.organization.id,
        role: "STAFF" as UserRole,
      })
      const emailSpy = vi
        .spyOn(emailSender, "sendActivationEmail")
        .mockResolvedValue(undefined)
      const invitedEmail = uniqueEmail()
      const userCountBefore = await prisma.user.count()
      const invitationCountBefore = await prisma.userInvitation.count()

      const response = await request(app)
        .post("/api/users/invite")
        .set("Authorization", `Bearer ${staffAccessToken}`)
        .send({ email: invitedEmail, role: "OWNER" })

      expect(response.status).toBe(403)
      expect(await prisma.user.count()).toBe(userCountBefore)
      expect(await prisma.userInvitation.count()).toBe(invitationCountBefore)
      expect(emailSpy).not.toHaveBeenCalled()
    })

    it("returns 409 with field email when the email already belongs to an active registered user, and creates no new rows", async () => {
      const owner = await registerOwner()
      const existingPayload = independentPayload()
      await request(app).post("/api/auth/register").send(existingPayload)

      const emailSpy = vi
        .spyOn(emailSender, "sendActivationEmail")
        .mockResolvedValue(undefined)
      const userCountBefore = await prisma.user.count()
      const invitationCountBefore = await prisma.userInvitation.count()

      const response = await request(app)
        .post("/api/users/invite")
        .set("Authorization", `Bearer ${owner.accessToken}`)
        .send({ email: existingPayload.email, role: "OWNER" })

      expect(response.status).toBe(409)
      expect(response.body).toMatchObject({ ok: false, field: "email" })
      expect(await prisma.user.count()).toBe(userCountBefore)
      expect(await prisma.userInvitation.count()).toBe(invitationCountBefore)
      expect(emailSpy).not.toHaveBeenCalled()
    })

    it("returns 409 when the email already has a pending invitation from a previous invite", async () => {
      const owner = await registerOwner()
      vi.spyOn(emailSender, "sendActivationEmail").mockResolvedValue(undefined)
      const invitedEmail = uniqueEmail()

      const first = await request(app)
        .post("/api/users/invite")
        .set("Authorization", `Bearer ${owner.accessToken}`)
        .send({ email: invitedEmail, role: "OWNER" })
      expect(first.status).toBe(201)

      const userCountBefore = await prisma.user.count()
      const invitationCountBefore = await prisma.userInvitation.count()

      const second = await request(app)
        .post("/api/users/invite")
        .set("Authorization", `Bearer ${owner.accessToken}`)
        .send({ email: invitedEmail, role: "OWNER" })

      expect(second.status).toBe(409)
      expect(second.body).toMatchObject({ ok: false, field: "email" })
      expect(await prisma.user.count()).toBe(userCountBefore)
      expect(await prisma.userInvitation.count()).toBe(invitationCountBefore)
    })
  })
})
