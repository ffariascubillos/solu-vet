import { randomUUID } from "node:crypto"
import request from "supertest"
import { afterEach, describe, expect, it, vi } from "vitest"
import { app } from "../../app.js"
import { prisma } from "../../lib/prisma.js"
import { emailSender } from "../../lib/email/resend-email-sender.js"
import { APP_URL } from "../../lib/env.js"
import { signAccessToken } from "../../lib/auth/access-token.js"
import { cleanDatabase } from "../../test/clean-database.js"
import { INVITABLE_ROLES } from "./users.schemas.js"

type StaffRole = (typeof INVITABLE_ROLES)[number]

const LIMIT_MESSAGE = "La clínica alcanzó el límite de 5 usuarios."
const INDEPENDENT_MESSAGE = "Las cuentas de veterinario independiente no pueden invitar usuarios."

const uniqueEmail = () => `users-test-${randomUUID()}@example.com`

const independentPayload = (overrides: Record<string, unknown> = {}) => ({
  organizationType: "INDEPENDENT",
  email: uniqueEmail(),
  password: "supersecret123",
  name: "Vet Owner",
  ...overrides,
})

async function registerOwner(overrides: Record<string, unknown> = {}) {
  const response = await request(app)
    .post("/api/auth/register")
    .send(
      independentPayload({
        organizationType: "CLINIC",
        organizationName: "Clinica Veterinaria Sur",
        ...overrides,
      }),
    )

  return response.body.data as {
    accessToken: string
    refreshToken: string
    user: { id: string; email: string; name: string; role: string }
    organization: { id: string; name: string; type: string }
  }
}

async function createStaff(
  organizationId: string,
  role: StaffRole = "VETERINARIAN",
  overrides: { createdAt?: Date; name?: string } = {},
) {
  const user = await prisma.user.create({
    data: {
      email: uniqueEmail(),
      passwordHash: "irrelevant-for-this-test",
      role,
      organizationId,
      ...overrides,
    },
  })
  const accessToken = signAccessToken({
    sub: user.id,
    organizationId: user.organizationId,
    role: user.role,
    sessionVersion: user.sessionVersion,
  })

  return { user, accessToken }
}

async function createInvitation(
  organizationId: string,
  invitedByUserId: string,
  overrides: {
    email?: string
    role?: StaffRole
    expiresAt?: Date
    acceptedAt?: Date
    createdAt?: Date
  } = {},
) {
  return prisma.userInvitation.create({
    data: {
      email: uniqueEmail(),
      role: "RECEPTIONIST",
      tokenHash: randomUUID(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      organizationId,
      invitedByUserId,
      ...overrides,
    },
  })
}

const expired = () => new Date(Date.now() - 1000)

function mockActivationEmail() {
  return vi.spyOn(emailSender, "sendActivationEmail").mockResolvedValue(undefined)
}

function invite(accessToken: string, body: Record<string, unknown>) {
  return request(app)
    .post("/api/users/invite")
    .set("Authorization", `Bearer ${accessToken}`)
    .send(body)
}

function getSeats(accessToken: string) {
  return request(app).get("/api/users/seats").set("Authorization", `Bearer ${accessToken}`)
}

async function activateInvitedStaff(ownerAccessToken: string, role: StaffRole) {
  const email = uniqueEmail()
  const password = "staffpassword123"
  const emailSpy = mockActivationEmail()

  const inviteResponse = await invite(ownerAccessToken, { email, role })
  expect(inviteResponse.status).toBe(201)

  const [, activationUrl] = emailSpy.mock.calls.at(-1) as [string, string]
  const token = new URL(activationUrl).searchParams.get("token") as string
  const activateResponse = await request(app)
    .post("/api/auth/activate")
    .send({ token, password })
  expect(activateResponse.status).toBe(200)

  const loginResponse = await request(app).post("/api/auth/login").send({ email, password })
  expect(loginResponse.status).toBe(200)

  return {
    email,
    password,
    id: loginResponse.body.data.user.id as string,
    accessToken: loginResponse.body.data.accessToken as string,
    refreshToken: loginResponse.body.data.refreshToken as string,
  }
}

describe("Users API", () => {
  afterEach(async () => {
    vi.restoreAllMocks()
    await cleanDatabase()
  })

  describe("POST /api/users/invite", () => {
    it.each(INVITABLE_ROLES)(
      "invites a new user as %s from a CLINIC OWNER: creates a UserInvitation without a User, and sends the activation email",
      async (role) => {
        const owner = await registerOwner()
        const emailSpy = mockActivationEmail()
        const invitedEmail = uniqueEmail()

        const response = await invite(owner.accessToken, { email: invitedEmail, role })

        expect(response.status).toBe(201)
        expect(response.body).toMatchObject({ ok: true })

        expect(await prisma.user.findUnique({ where: { email: invitedEmail } })).toBeNull()

        const invitation = await prisma.userInvitation.findFirstOrThrow({
          where: { email: invitedEmail },
        })
        expect(invitation.organizationId).toBe(owner.organization.id)
        expect(invitation.role).toBe(role)
        expect(invitation.invitedByUserId).toBe(owner.user.id)
        expect(invitation.acceptedAt).toBeNull()
        expect(invitation.expiresAt.getTime()).toBeGreaterThan(Date.now())

        expect(emailSpy).toHaveBeenCalledTimes(1)
        const [calledEmail, activationUrl] = emailSpy.mock.calls[0] as [string, string]
        expect(calledEmail).toBe(invitedEmail)
        expect(activationUrl.startsWith(`${APP_URL}/activate?token=`)).toBe(true)
        expect(activationUrl).not.toMatch(/password/i)
      },
    )

    it("returns 401 without an Authorization header and does not create rows or send an email", async () => {
      const emailSpy = mockActivationEmail()
      const invitedEmail = uniqueEmail()
      const userCountBefore = await prisma.user.count()
      const invitationCountBefore = await prisma.userInvitation.count()

      const response = await request(app)
        .post("/api/users/invite")
        .send({ email: invitedEmail, role: "VETERINARIAN" })

      expect(response.status).toBe(401)
      expect(await prisma.user.count()).toBe(userCountBefore)
      expect(await prisma.userInvitation.count()).toBe(invitationCountBefore)
      expect(emailSpy).not.toHaveBeenCalled()
    })

    it.each([
      ["OWNER", { role: "OWNER" }],
      ["a missing role", {}],
    ])("returns 400 for %s and creates no invitation", async (_label, body) => {
      const owner = await registerOwner()
      const emailSpy = mockActivationEmail()
      const invitedEmail = uniqueEmail()

      const response = await invite(owner.accessToken, { email: invitedEmail, ...body })

      expect(response.status).toBe(400)
      expect(response.body.ok).toBe(false)
      expect(await prisma.userInvitation.count({ where: { email: invitedEmail } })).toBe(0)
      expect(emailSpy).not.toHaveBeenCalled()
    })

    it("returns 403 with the independent message for the OWNER of an INDEPENDENT organization and creates no invitation", async () => {
      const owner = await registerOwner({ organizationType: "INDEPENDENT" })
      const emailSpy = mockActivationEmail()
      const invitedEmail = uniqueEmail()

      const response = await invite(owner.accessToken, {
        email: invitedEmail,
        role: "VETERINARIAN",
      })

      expect(response.status).toBe(403)
      expect(response.body).toEqual({ ok: false, message: INDEPENDENT_MESSAGE })
      expect(await prisma.userInvitation.count()).toBe(0)
      expect(emailSpy).not.toHaveBeenCalled()
    })

    it("returns 409 with field email when the email already belongs to a user of another organization, and creates no new rows", async () => {
      const owner = await registerOwner()
      const existingPayload = independentPayload()
      await request(app).post("/api/auth/register").send(existingPayload)

      const emailSpy = mockActivationEmail()
      const userCountBefore = await prisma.user.count()
      const invitationCountBefore = await prisma.userInvitation.count()

      const response = await invite(owner.accessToken, {
        email: existingPayload.email,
        role: "VETERINARIAN",
      })

      expect(response.status).toBe(409)
      expect(response.body).toEqual({
        ok: false,
        field: "email",
        message: "Ya existe una cuenta con este correo.",
      })
      expect(await prisma.user.count()).toBe(userCountBefore)
      expect(await prisma.userInvitation.count()).toBe(invitationCountBefore)
      expect(emailSpy).not.toHaveBeenCalled()
    })

    it("returns 409 with field email when the email already belongs to a user of the same organization", async () => {
      const owner = await registerOwner()
      const { user: staff } = await createStaff(owner.organization.id)
      const emailSpy = mockActivationEmail()

      const response = await invite(owner.accessToken, {
        email: staff.email,
        role: "RECEPTIONIST",
      })

      expect(response.status).toBe(409)
      expect(response.body).toMatchObject({ ok: false, field: "email" })
      expect(await prisma.userInvitation.count()).toBe(0)
      expect(emailSpy).not.toHaveBeenCalled()
    })

    it("returns 409 when the email already has a pending invitation from a previous invite", async () => {
      const owner = await registerOwner()
      mockActivationEmail()
      const invitedEmail = uniqueEmail()

      const first = await invite(owner.accessToken, {
        email: invitedEmail,
        role: "VETERINARIAN",
      })
      expect(first.status).toBe(201)

      const userCountBefore = await prisma.user.count()
      const invitationCountBefore = await prisma.userInvitation.count()

      const second = await invite(owner.accessToken, {
        email: invitedEmail,
        role: "VETERINARIAN",
      })

      expect(second.status).toBe(409)
      expect(second.body).toEqual({
        ok: false,
        field: "email",
        message: "Ya hay una invitación pendiente para este correo.",
      })
      expect(await prisma.user.count()).toBe(userCountBefore)
      expect(await prisma.userInvitation.count()).toBe(invitationCountBefore)
    })

    it("returns 409 with field email when the email has a pending invitation from another organization", async () => {
      const owner = await registerOwner()
      const otherOwner = await registerOwner()
      const invitedEmail = uniqueEmail()
      await createInvitation(otherOwner.organization.id, otherOwner.user.id, {
        email: invitedEmail,
      })
      const emailSpy = mockActivationEmail()

      const response = await invite(owner.accessToken, {
        email: invitedEmail,
        role: "VETERINARIAN",
      })

      expect(response.status).toBe(409)
      expect(response.body).toEqual({
        ok: false,
        field: "email",
        message: "Ya hay una invitación pendiente para este correo.",
      })
      expect(
        await prisma.userInvitation.count({
          where: { organizationId: owner.organization.id },
        }),
      ).toBe(0)
      expect(emailSpy).not.toHaveBeenCalled()
    })

    it("accepts an invitation with 1 active user and 2 pending invitations", async () => {
      const owner = await registerOwner()
      await createInvitation(owner.organization.id, owner.user.id)
      await createInvitation(owner.organization.id, owner.user.id)
      mockActivationEmail()

      const response = await invite(owner.accessToken, {
        email: uniqueEmail(),
        role: "ASSISTANT",
      })

      expect(response.status).toBe(201)
    })

    it("returns 409 with the limit message with 3 active users and 2 pending invitations, and creates no invitation", async () => {
      const owner = await registerOwner()
      await createStaff(owner.organization.id, "VETERINARIAN")
      await createStaff(owner.organization.id, "RECEPTIONIST")
      await createInvitation(owner.organization.id, owner.user.id)
      await createInvitation(owner.organization.id, owner.user.id)
      const emailSpy = mockActivationEmail()
      const invitedEmail = uniqueEmail()

      const response = await invite(owner.accessToken, {
        email: invitedEmail,
        role: "ASSISTANT",
      })

      expect(response.status).toBe(409)
      expect(response.body).toEqual({ ok: false, message: LIMIT_MESSAGE })
      expect(await prisma.userInvitation.count({ where: { email: invitedEmail } })).toBe(0)
      expect(emailSpy).not.toHaveBeenCalled()
    })

    it("does not count an expired invitation: with 4 active users and 1 expired invitation, re-inviting that same email is accepted", async () => {
      const owner = await registerOwner()
      await createStaff(owner.organization.id, "VETERINARIAN")
      await createStaff(owner.organization.id, "RECEPTIONIST")
      await createStaff(owner.organization.id, "ASSISTANT")
      const expiredInvitation = await createInvitation(owner.organization.id, owner.user.id, {
        expiresAt: expired(),
      })
      mockActivationEmail()

      const response = await invite(owner.accessToken, {
        email: expiredInvitation.email,
        role: "VETERINARIAN",
      })

      expect(response.status).toBe(201)
      expect(
        await prisma.userInvitation.count({ where: { email: expiredInvitation.email } }),
      ).toBe(2)
    })

    it("accepts exactly one of two concurrent invitations when the clinic has 4 of 5 seats taken", async () => {
      const owner = await registerOwner()
      await createStaff(owner.organization.id, "VETERINARIAN")
      await createStaff(owner.organization.id, "RECEPTIONIST")
      await createInvitation(owner.organization.id, owner.user.id)
      const emailSpy = mockActivationEmail()

      const responses = await Promise.all([
        invite(owner.accessToken, { email: uniqueEmail(), role: "ASSISTANT" }),
        invite(owner.accessToken, { email: uniqueEmail(), role: "ASSISTANT" }),
      ])

      const statuses = responses.map((response) => response.status).sort()
      expect(statuses).toEqual([201, 409])
      const rejected = responses.find((response) => response.status === 409)!
      expect(rejected.body).toEqual({ ok: false, message: LIMIT_MESSAGE })

      expect(
        await prisma.userInvitation.count({
          where: { organizationId: owner.organization.id },
        }),
      ).toBe(2)
      expect(emailSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe("staff roles on member management endpoints", () => {
    it.each(INVITABLE_ROLES)(
      "returns 403 for a %s on invite, seats, cancel invitation and remove user, and changes nothing",
      async (role) => {
        const owner = await registerOwner()
        const { accessToken: staffAccessToken } = await createStaff(owner.organization.id, role)
        const { user: colleague } = await createStaff(owner.organization.id, "ASSISTANT")
        const invitation = await createInvitation(owner.organization.id, owner.user.id)
        const emailSpy = mockActivationEmail()
        const auth = `Bearer ${staffAccessToken}`

        const inviteResponse = await request(app)
          .post("/api/users/invite")
          .set("Authorization", auth)
          .send({ email: uniqueEmail(), role: "VETERINARIAN" })
        const seatsResponse = await request(app).get("/api/users/seats").set("Authorization", auth)
        const cancelResponse = await request(app)
          .delete(`/api/users/invitations/${invitation.id}`)
          .set("Authorization", auth)
        const removeResponse = await request(app)
          .delete(`/api/users/${colleague.id}`)
          .set("Authorization", auth)

        expect(inviteResponse.status).toBe(403)
        expect(seatsResponse.status).toBe(403)
        expect(cancelResponse.status).toBe(403)
        expect(removeResponse.status).toBe(403)

        expect(await prisma.userInvitation.count()).toBe(1)
        expect(await prisma.userInvitation.findUnique({ where: { id: invitation.id } })).not.toBeNull()
        expect(await prisma.user.findUnique({ where: { id: colleague.id } })).not.toBeNull()
        expect(emailSpy).not.toHaveBeenCalled()
      },
    )
  })

  describe("GET /api/users/seats", () => {
    it("lists the limit, users by createdAt and then pending invitations by createdAt, excluding other organizations and expired or accepted invitations", async () => {
      const owner = await registerOwner({ name: "Dra. Dueña" })
      const ownerRow = await prisma.user.findUniqueOrThrow({ where: { id: owner.user.id } })
      const base = ownerRow.createdAt.getTime()

      const { user: laterStaff } = await createStaff(owner.organization.id, "RECEPTIONIST", {
        createdAt: new Date(base + 2000),
        name: "Recepción",
      })
      const { user: earlierStaff } = await createStaff(owner.organization.id, "VETERINARIAN", {
        createdAt: new Date(base + 1000),
      })

      const laterInvitation = await createInvitation(owner.organization.id, owner.user.id, {
        role: "ASSISTANT",
        createdAt: new Date(base + 5000),
      })
      const earliestInvitation = await createInvitation(owner.organization.id, owner.user.id, {
        role: "VETERINARIAN",
        createdAt: new Date(base - 10000),
      })
      await createInvitation(owner.organization.id, owner.user.id, { expiresAt: expired() })
      await createInvitation(owner.organization.id, owner.user.id, { acceptedAt: new Date() })

      const otherOwner = await registerOwner()
      await createStaff(otherOwner.organization.id, "VETERINARIAN")
      await createInvitation(otherOwner.organization.id, otherOwner.user.id)

      const response = await getSeats(owner.accessToken)

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        ok: true,
        data: {
          limit: 5,
          seats: [
            {
              id: owner.user.id,
              kind: "USER",
              name: "Dra. Dueña",
              email: owner.user.email,
              role: "OWNER",
              status: "ACTIVE",
            },
            {
              id: earlierStaff.id,
              kind: "USER",
              name: null,
              email: earlierStaff.email,
              role: "VETERINARIAN",
              status: "ACTIVE",
            },
            {
              id: laterStaff.id,
              kind: "USER",
              name: "Recepción",
              email: laterStaff.email,
              role: "RECEPTIONIST",
              status: "ACTIVE",
            },
            {
              id: earliestInvitation.id,
              kind: "INVITATION",
              name: null,
              email: earliestInvitation.email,
              role: "VETERINARIAN",
              status: "PENDING",
            },
            {
              id: laterInvitation.id,
              kind: "INVITATION",
              name: null,
              email: laterInvitation.email,
              role: "ASSISTANT",
              status: "PENDING",
            },
          ],
        },
      })
    })

    it("returns the limit 1 and only the owner's seat for an INDEPENDENT owner", async () => {
      const owner = await registerOwner({ organizationType: "INDEPENDENT" })

      const response = await getSeats(owner.accessToken)

      expect(response.status).toBe(200)
      expect(response.body.data.limit).toBe(1)
      expect(response.body.data.seats).toEqual([
        expect.objectContaining({ id: owner.user.id, kind: "USER", status: "ACTIVE" }),
      ])
    })

    it("returns 401 without an Authorization header", async () => {
      const response = await request(app).get("/api/users/seats")

      expect(response.status).toBe(401)
    })
  })

  describe("DELETE /api/users/invitations/:id", () => {
    it("cancels a pending invitation: it leaves the seat list, the count drops by one, and its activation link is rejected", async () => {
      const owner = await registerOwner()
      const emailSpy = mockActivationEmail()
      const invitedEmail = uniqueEmail()
      const inviteResponse = await invite(owner.accessToken, {
        email: invitedEmail,
        role: "RECEPTIONIST",
      })
      expect(inviteResponse.status).toBe(201)
      const [, activationUrl] = emailSpy.mock.calls[0] as [string, string]
      const token = new URL(activationUrl).searchParams.get("token") as string
      const invitation = await prisma.userInvitation.findFirstOrThrow({
        where: { email: invitedEmail },
      })

      const seatsBefore = await getSeats(owner.accessToken)
      expect(seatsBefore.body.data.seats).toHaveLength(2)

      const response = await request(app)
        .delete(`/api/users/invitations/${invitation.id}`)
        .set("Authorization", `Bearer ${owner.accessToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ ok: true })

      const seatsAfter = await getSeats(owner.accessToken)
      expect(seatsAfter.body.data.seats).toHaveLength(1)
      expect(
        seatsAfter.body.data.seats.some((seat: { id: string }) => seat.id === invitation.id),
      ).toBe(false)

      const activateResponse = await request(app)
        .post("/api/auth/activate")
        .send({ token, password: "somenewpassword123" })
      expect(activateResponse.status).toBe(400)
      expect(await prisma.user.findUnique({ where: { email: invitedEmail } })).toBeNull()
    })

    it("returns 404 for an invitation of another organization and leaves it unchanged", async () => {
      const owner = await registerOwner()
      const otherOwner = await registerOwner()
      const otherInvitation = await createInvitation(
        otherOwner.organization.id,
        otherOwner.user.id,
      )

      const response = await request(app)
        .delete(`/api/users/invitations/${otherInvitation.id}`)
        .set("Authorization", `Bearer ${owner.accessToken}`)

      expect(response.status).toBe(404)
      expect(response.body).toEqual({ ok: false, message: "No se encontró la invitación." })
      expect(
        await prisma.userInvitation.findUniqueOrThrow({ where: { id: otherInvitation.id } }),
      ).toEqual(otherInvitation)
    })

    it.each([
      ["expired", { expiresAt: expired() }],
      ["accepted", { acceptedAt: new Date() }],
    ])("returns 404 for an %s invitation and leaves it unchanged", async (_label, overrides) => {
      const owner = await registerOwner()
      const invitation = await createInvitation(owner.organization.id, owner.user.id, overrides)

      const response = await request(app)
        .delete(`/api/users/invitations/${invitation.id}`)
        .set("Authorization", `Bearer ${owner.accessToken}`)

      expect(response.status).toBe(404)
      expect(response.body).toEqual({ ok: false, message: "No se encontró la invitación." })
      expect(
        await prisma.userInvitation.findUniqueOrThrow({ where: { id: invitation.id } }),
      ).toEqual(invitation)
    })

    it("returns 404 for an unknown invitation id", async () => {
      const owner = await registerOwner()

      const response = await request(app)
        .delete(`/api/users/invitations/${randomUUID()}`)
        .set("Authorization", `Bearer ${owner.accessToken}`)

      expect(response.status).toBe(404)
    })
  })

  describe("DELETE /api/users/:id", () => {
    it("removes a staff member: their access token gets 401, login and refresh fail, they leave the seat list and the email can be invited again", async () => {
      const owner = await registerOwner()
      const staff = await activateInvitedStaff(owner.accessToken, "VETERINARIAN")
      vi.spyOn(emailSender, "sendPasswordResetEmail").mockResolvedValue(undefined)
      await request(app).post("/api/auth/password-reset/request").send({ email: staff.email })
      expect(await prisma.passwordResetToken.count({ where: { userId: staff.id } })).toBe(1)

      const beforeRemoval = await request(app)
        .get("/api/tutors")
        .set("Authorization", `Bearer ${staff.accessToken}`)
      expect(beforeRemoval.status).toBe(200)

      const response = await request(app)
        .delete(`/api/users/${staff.id}`)
        .set("Authorization", `Bearer ${owner.accessToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ ok: true })
      expect(await prisma.user.findUnique({ where: { id: staff.id } })).toBeNull()

      const withRemovedToken = await request(app)
        .get("/api/tutors")
        .set("Authorization", `Bearer ${staff.accessToken}`)
      expect(withRemovedToken.status).toBe(401)

      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({ email: staff.email, password: staff.password })
      expect(loginResponse.status).toBe(401)

      const refreshResponse = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: staff.refreshToken })
      expect(refreshResponse.status).toBe(401)

      const seats = await getSeats(owner.accessToken)
      expect(seats.body.data.seats).toEqual([
        expect.objectContaining({ id: owner.user.id }),
      ])

      const reinvite = await invite(owner.accessToken, {
        email: staff.email,
        role: "RECEPTIONIST",
      })
      expect(reinvite.status).toBe(201)
    })

    it("returns 400 when the OWNER tries to remove themselves and the user remains", async () => {
      const owner = await registerOwner()

      const response = await request(app)
        .delete(`/api/users/${owner.user.id}`)
        .set("Authorization", `Bearer ${owner.accessToken}`)

      expect(response.status).toBe(400)
      expect(response.body).toEqual({ ok: false, message: "No puedes darte de baja a ti mismo." })
      expect(await prisma.user.findUnique({ where: { id: owner.user.id } })).not.toBeNull()
    })

    it("returns 404 for a user of another organization and leaves that user unchanged", async () => {
      const owner = await registerOwner()
      const otherOwner = await registerOwner()
      const { user: otherStaff, accessToken: otherStaffToken } = await createStaff(
        otherOwner.organization.id,
      )

      const response = await request(app)
        .delete(`/api/users/${otherStaff.id}`)
        .set("Authorization", `Bearer ${owner.accessToken}`)

      expect(response.status).toBe(404)
      expect(response.body).toEqual({ ok: false, message: "No se encontró el usuario." })
      expect(await prisma.user.findUniqueOrThrow({ where: { id: otherStaff.id } })).toEqual(
        otherStaff,
      )

      const stillWorks = await request(app)
        .get("/api/tutors")
        .set("Authorization", `Bearer ${otherStaffToken}`)
      expect(stillWorks.status).toBe(200)
    })

    it("returns 404 for an unknown user id", async () => {
      const owner = await registerOwner()

      const response = await request(app)
        .delete(`/api/users/${randomUUID()}`)
        .set("Authorization", `Bearer ${owner.accessToken}`)

      expect(response.status).toBe(404)
    })
  })
})
