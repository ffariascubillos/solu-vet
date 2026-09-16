import { randomUUID } from "node:crypto"
import request from "supertest"
import { afterEach, describe, expect, it, vi } from "vitest"
import { app } from "../../app.js"
import { prisma } from "../../lib/prisma.js"
import { issuePasswordResetToken } from "../../lib/auth/password-reset-token.js"
import { emailSender } from "../../lib/email/resend-email-sender.js"
import { verifyAccessToken } from "../../lib/auth/access-token.js"

const uniqueEmail = () => `auth-test-${randomUUID()}@example.com`

const independentPayload = (overrides: Record<string, unknown> = {}) => ({
  organizationType: "INDEPENDENT",
  email: uniqueEmail(),
  password: "supersecret123",
  name: "Vet Owner",
  ...overrides,
})

const clinicPayload = (overrides: Record<string, unknown> = {}) => ({
  organizationType: "CLINIC",
  email: uniqueEmail(),
  password: "supersecret123",
  name: "Vet Owner",
  organizationName: "Clinica Veterinaria Sur",
  ...overrides,
})

async function cleanDatabase() {
  await prisma.userInvitation.deleteMany()
  await prisma.passwordResetToken.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()
  await prisma.organization.deleteMany()
}

async function registerUser(overrides: Record<string, unknown> = {}) {
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

async function inviteAndCaptureToken(accessToken: string, email: string) {
  const emailSpy = vi.spyOn(emailSender, "sendActivationEmail").mockResolvedValue(undefined)

  const response = await request(app)
    .post("/api/users/invite")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ email, role: "OWNER" })

  const [, activationUrl] = emailSpy.mock.calls.at(-1) as [string, string]
  const token = new URL(activationUrl).searchParams.get("token") as string

  return { response, activationUrl, token }
}

describe("Auth API", () => {
  afterEach(async () => {
    vi.restoreAllMocks()
    await cleanDatabase()
  })

  describe("POST /api/auth/register", () => {
    it("registers a new INDEPENDENT organization and owner", async () => {
      const payload = independentPayload()

      const response = await request(app).post("/api/auth/register").send(payload)

      expect(response.status).toBe(201)
      expect(response.body.ok).toBe(true)
      expect(response.body.data.accessToken).toEqual(expect.any(String))
      expect(response.body.data.refreshToken).toEqual(expect.any(String))
      expect(response.body.data.user).toMatchObject({
        email: payload.email,
        name: payload.name,
        role: "OWNER",
      })
      expect(response.body.data.organization).toMatchObject({
        type: "INDEPENDENT",
        name: payload.name,
      })

      const organization = await prisma.organization.findUniqueOrThrow({
        where: { id: response.body.data.organization.id },
      })
      expect(organization.type).toBe("INDEPENDENT")

      const user = await prisma.user.findUniqueOrThrow({
        where: { id: response.body.data.user.id },
      })
      expect(user.role).toBe("OWNER")
      expect(user.organizationId).toBe(organization.id)
    })

    it("registers a new CLINIC organization using organizationName, not the user's name", async () => {
      const payload = clinicPayload()

      const response = await request(app).post("/api/auth/register").send(payload)

      expect(response.status).toBe(201)
      expect(response.body.ok).toBe(true)
      expect(response.body.data.organization).toMatchObject({
        type: "CLINIC",
        name: payload.organizationName,
      })
      expect(response.body.data.organization.name).not.toBe(payload.name)
    })

    it("returns 409 when the email is already registered and does not create new records", async () => {
      const payload = independentPayload()
      await request(app).post("/api/auth/register").send(payload)

      const userCountBefore = await prisma.user.count()
      const organizationCountBefore = await prisma.organization.count()

      const response = await request(app)
        .post("/api/auth/register")
        .send(independentPayload({ email: payload.email }))

      expect(response.status).toBe(409)
      expect(response.body).toMatchObject({
        ok: false,
        field: "email",
      })

      const userCountAfter = await prisma.user.count()
      const organizationCountAfter = await prisma.organization.count()
      expect(userCountAfter).toBe(userCountBefore)
      expect(organizationCountAfter).toBe(organizationCountBefore)

      const usersWithEmail = await prisma.user.findMany({
        where: { email: payload.email },
      })
      expect(usersWithEmail).toHaveLength(1)
    })
  })

  describe("POST /api/auth/login", () => {
    it("logs in with correct credentials", async () => {
      const payload = independentPayload()
      await request(app).post("/api/auth/register").send(payload)

      const response = await request(app)
        .post("/api/auth/login")
        .send({ email: payload.email, password: payload.password })

      expect(response.status).toBe(200)
      expect(response.body.ok).toBe(true)
      expect(response.body.data.accessToken).toEqual(expect.any(String))
      expect(response.body.data.refreshToken).toEqual(expect.any(String))
      expect(response.body.data.user.email).toBe(payload.email)
      expect(response.body.data.organization).toEqual(expect.any(Object))
    })

    it("returns 401 with a generic message on incorrect password", async () => {
      const payload = independentPayload()
      await request(app).post("/api/auth/register").send(payload)

      const response = await request(app)
        .post("/api/auth/login")
        .send({ email: payload.email, password: "wrong-password" })

      expect(response.status).toBe(401)
      expect(response.body).toMatchObject({
        ok: false,
        message: "Correo o contraseña incorrectos.",
      })
    })

    it("returns the same status and generic message for an unregistered email", async () => {
      const payload = independentPayload()
      await request(app).post("/api/auth/register").send(payload)

      const wrongPasswordResponse = await request(app)
        .post("/api/auth/login")
        .send({ email: payload.email, password: "wrong-password" })

      const unknownEmailResponse = await request(app)
        .post("/api/auth/login")
        .send({ email: uniqueEmail(), password: "wrong-password" })

      expect(unknownEmailResponse.status).toBe(wrongPasswordResponse.status)
      expect(unknownEmailResponse.body.message).toBe(wrongPasswordResponse.body.message)
      expect(unknownEmailResponse.body).toMatchObject({
        ok: false,
        message: "Correo o contraseña incorrectos.",
      })
    })
  })

  describe("POST /api/auth/refresh", () => {
    it("rotates a valid refresh token", async () => {
      const registered = await registerUser()

      const response = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: registered.refreshToken })

      expect(response.status).toBe(200)
      expect(response.body.ok).toBe(true)
      expect(response.body.data.accessToken).toEqual(expect.any(String))
      expect(response.body.data.refreshToken).toEqual(expect.any(String))
      expect(response.body.data.refreshToken).not.toBe(registered.refreshToken)

      const reuseResponse = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: registered.refreshToken })

      expect(reuseResponse.status).toBe(401)
    })

    it("returns 401 when reusing an already rotated refresh token", async () => {
      const registered = await registerUser()

      await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: registered.refreshToken })

      const response = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: registered.refreshToken })

      expect(response.status).toBe(401)
      expect(response.body).toMatchObject({
        ok: false,
        message: "Refresh token inválido o expirado.",
      })
    })

    it("returns 401 for an unknown refresh token", async () => {
      const response = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: "not-a-real-refresh-token" })

      expect(response.status).toBe(401)
      expect(response.body).toMatchObject({
        ok: false,
        message: "Refresh token inválido o expirado.",
      })
    })
  })

  describe("POST /api/auth/logout", () => {
    it("revokes the refresh token so it can no longer be used to refresh", async () => {
      const registered = await registerUser()

      const logoutResponse = await request(app)
        .post("/api/auth/logout")
        .send({ refreshToken: registered.refreshToken })

      expect(logoutResponse.status).toBe(200)
      expect(logoutResponse.body).toMatchObject({ ok: true })

      const refreshResponse = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: registered.refreshToken })

      expect(refreshResponse.status).toBe(401)
    })
  })

  describe("POST /api/auth/logout-all", () => {
    it("returns 401 without an Authorization header", async () => {
      const response = await request(app).post("/api/auth/logout-all")

      expect(response.status).toBe(401)
    })

    it("revokes every refresh token for the user across simulated devices", async () => {
      const payload = independentPayload()
      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send(payload)
      const deviceA = registerResponse.body.data as {
        accessToken: string
        refreshToken: string
      }

      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({ email: payload.email, password: payload.password })
      const deviceB = loginResponse.body.data as {
        accessToken: string
        refreshToken: string
      }

      const logoutAllResponse = await request(app)
        .post("/api/auth/logout-all")
        .set("Authorization", `Bearer ${deviceA.accessToken}`)

      expect(logoutAllResponse.status).toBe(200)
      expect(logoutAllResponse.body).toMatchObject({ ok: true })

      const refreshA = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: deviceA.refreshToken })
      const refreshB = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: deviceB.refreshToken })

      expect(refreshA.status).toBe(401)
      expect(refreshB.status).toBe(401)
    })
  })

  describe("POST /api/auth/password-reset/request", () => {
    it("returns 200 with a generic message for a registered email", async () => {
      const payload = independentPayload()
      await request(app).post("/api/auth/register").send(payload)

      const response = await request(app)
        .post("/api/auth/password-reset/request")
        .send({ email: payload.email })

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        ok: true,
        message: "Si el correo está registrado, recibirás un enlace para recuperar tu contraseña.",
      })
    })

    it("returns the same status and body for an unregistered email", async () => {
      const registeredPayload = independentPayload()
      await request(app).post("/api/auth/register").send(registeredPayload)

      const registeredResponse = await request(app)
        .post("/api/auth/password-reset/request")
        .send({ email: registeredPayload.email })

      const unknownResponse = await request(app)
        .post("/api/auth/password-reset/request")
        .send({ email: uniqueEmail() })

      expect(unknownResponse.status).toBe(registeredResponse.status)
      expect(unknownResponse.body).toEqual(registeredResponse.body)
    })
  })

  describe("POST /api/auth/password-reset/confirm", () => {
    it("resets the password with a valid token and revokes previous sessions", async () => {
      const payload = independentPayload()
      const registerResponse = await request(app).post("/api/auth/register").send(payload)
      const { user, refreshToken: oldRefreshToken } = registerResponse.body.data as {
        user: { id: string }
        refreshToken: string
      }

      const resetToken = await issuePasswordResetToken(user.id)
      const newPassword = "brandnewpassword123"

      const confirmResponse = await request(app)
        .post("/api/auth/password-reset/confirm")
        .send({ token: resetToken, newPassword })

      expect(confirmResponse.status).toBe(200)
      expect(confirmResponse.body).toMatchObject({ ok: true })

      const oldPasswordLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: payload.email, password: payload.password })
      expect(oldPasswordLogin.status).toBe(401)

      const newPasswordLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: payload.email, password: newPassword })
      expect(newPasswordLogin.status).toBe(200)

      const refreshResponse = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: oldRefreshToken })
      expect(refreshResponse.status).toBe(401)
    })

    it("returns 400 for an invalid or unknown token", async () => {
      const response = await request(app)
        .post("/api/auth/password-reset/confirm")
        .send({ token: "not-a-real-reset-token", newPassword: "supersecret123" })

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        ok: false,
        message: "El enlace no es válido o ya expiró.",
      })
    })

    it("returns 400 when the token was already used and does not change the password twice", async () => {
      const payload = independentPayload()
      const registerResponse = await request(app).post("/api/auth/register").send(payload)
      const { user } = registerResponse.body.data as { user: { id: string } }

      const resetToken = await issuePasswordResetToken(user.id)
      const firstNewPassword = "firstnewpassword1"
      const secondNewPassword = "secondnewpassword2"

      const firstConfirm = await request(app)
        .post("/api/auth/password-reset/confirm")
        .send({ token: resetToken, newPassword: firstNewPassword })
      expect(firstConfirm.status).toBe(200)

      const secondConfirm = await request(app)
        .post("/api/auth/password-reset/confirm")
        .send({ token: resetToken, newPassword: secondNewPassword })
      expect(secondConfirm.status).toBe(400)

      const loginWithFirstPassword = await request(app)
        .post("/api/auth/login")
        .send({ email: payload.email, password: firstNewPassword })
      expect(loginWithFirstPassword.status).toBe(200)

      const loginWithSecondPassword = await request(app)
        .post("/api/auth/login")
        .send({ email: payload.email, password: secondNewPassword })
      expect(loginWithSecondPassword.status).toBe(401)
    })
  })

  describe("POST /api/auth/activate", () => {
    it("activates a pending invited user with a valid token, marks the invitation accepted, and allows login with the new password", async () => {
      const owner = await registerUser()
      const invitedEmail = uniqueEmail()
      const { response: inviteResponse, token } = await inviteAndCaptureToken(
        owner.accessToken,
        invitedEmail,
      )
      expect(inviteResponse.status).toBe(201)
      const newPassword = "activatedpassword123"

      const response = await request(app)
        .post("/api/auth/activate")
        .send({ token, password: newPassword })

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({ ok: true })

      const invitation = await prisma.userInvitation.findFirstOrThrow({
        where: { email: invitedEmail },
      })
      expect(invitation.acceptedAt).not.toBeNull()

      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({ email: invitedEmail, password: newPassword })
      expect(loginResponse.status).toBe(200)
    })

    it("returns 401 when trying to log in with any password before the invitation is activated", async () => {
      const owner = await registerUser()
      const invitedEmail = uniqueEmail()
      await inviteAndCaptureToken(owner.accessToken, invitedEmail)

      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({ email: invitedEmail, password: "some-random-password" })

      expect(loginResponse.status).toBe(401)
    })

    it("returns 400 for an expired token and does not change the pending user's password", async () => {
      const owner = await registerUser()
      const invitedEmail = uniqueEmail()
      const { token } = await inviteAndCaptureToken(owner.accessToken, invitedEmail)

      await prisma.userInvitation.updateMany({
        where: { email: invitedEmail },
        data: { expiresAt: new Date(Date.now() - 1000) },
      })

      const response = await request(app)
        .post("/api/auth/activate")
        .send({ token, password: "somenewpassword123" })

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        ok: false,
        message: "El enlace no es válido o ya expiró.",
      })

      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({ email: invitedEmail, password: "somenewpassword123" })
      expect(loginResponse.status).toBe(401)
    })

    it("returns 400 when the token was already used and does not allow a second activation with a different password", async () => {
      const owner = await registerUser()
      const invitedEmail = uniqueEmail()
      const { token } = await inviteAndCaptureToken(owner.accessToken, invitedEmail)
      const firstPassword = "firstactivationpwd1"
      const secondPassword = "secondactivationpwd2"

      const firstActivate = await request(app)
        .post("/api/auth/activate")
        .send({ token, password: firstPassword })
      expect(firstActivate.status).toBe(200)

      const secondActivate = await request(app)
        .post("/api/auth/activate")
        .send({ token, password: secondPassword })
      expect(secondActivate.status).toBe(400)

      const loginWithFirstPassword = await request(app)
        .post("/api/auth/login")
        .send({ email: invitedEmail, password: firstPassword })
      expect(loginWithFirstPassword.status).toBe(200)

      const loginWithSecondPassword = await request(app)
        .post("/api/auth/login")
        .send({ email: invitedEmail, password: secondPassword })
      expect(loginWithSecondPassword.status).toBe(401)
    })

    it("returns 400 for an unknown or invented token", async () => {
      const response = await request(app)
        .post("/api/auth/activate")
        .send({ token: "not-a-real-invitation-token", password: "somenewpassword123" })

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        ok: false,
        message: "El enlace no es válido o ya expiró.",
      })
    })

    it("ignores organizationId and role sent in the body and keeps the invitation's original values", async () => {
      const owner = await registerUser()
      const invitedEmail = uniqueEmail()
      const { token } = await inviteAndCaptureToken(owner.accessToken, invitedEmail)
      const newPassword = "activatedpassword123"

      const response = await request(app).post("/api/auth/activate").send({
        token,
        password: newPassword,
        organizationId: "some-other-org-id",
        role: "SOMETHING_ELSE",
      })

      expect(response.status).toBe(200)

      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({ email: invitedEmail, password: newPassword })

      expect(loginResponse.status).toBe(200)
      expect(loginResponse.body.data.organization.id).toBe(owner.organization.id)
      expect(loginResponse.body.data.user.role).toBe("OWNER")

      const decoded = verifyAccessToken(loginResponse.body.data.accessToken)
      expect(decoded.organizationId).toBe(owner.organization.id)
      expect(decoded.role).toBe("OWNER")
    })

    it("rolls back acceptedAt when activation fails mid-transaction, leaving the invitation usable for inspection but still not accepted", async () => {
      const owner = await registerUser()
      const invitedEmail = uniqueEmail()
      const { token } = await inviteAndCaptureToken(owner.accessToken, invitedEmail)

      await prisma.user.delete({ where: { email: invitedEmail } })

      const response = await request(app)
        .post("/api/auth/activate")
        .send({ token, password: "somenewpassword123" })

      expect(response.status).toBeGreaterThanOrEqual(400)

      const invitation = await prisma.userInvitation.findFirstOrThrow({
        where: { email: invitedEmail },
      })
      expect(invitation.acceptedAt).toBeNull()
    })
  })

  describe("Invitation activation end-to-end flow", () => {
    it("registers an owner, invites a user, activates the invitation, and logs in with the correct organization and role", async () => {
      const ownerPayload = independentPayload()
      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send(ownerPayload)
      const owner = registerResponse.body.data as {
        accessToken: string
        organization: { id: string }
      }

      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({ email: ownerPayload.email, password: ownerPayload.password })
      expect(loginResponse.status).toBe(200)
      const ownerAccessToken = loginResponse.body.data.accessToken as string

      const invitedEmail = uniqueEmail()
      const { response: inviteResponse, token } = await inviteAndCaptureToken(
        ownerAccessToken,
        invitedEmail,
      )
      expect(inviteResponse.status).toBe(201)

      const newPassword = "brandnewaccountpwd1"
      const activateResponse = await request(app)
        .post("/api/auth/activate")
        .send({ token, password: newPassword })
      expect(activateResponse.status).toBe(200)

      const invitedLoginResponse = await request(app)
        .post("/api/auth/login")
        .send({ email: invitedEmail, password: newPassword })

      expect(invitedLoginResponse.status).toBe(200)
      expect(invitedLoginResponse.body.data.organization.id).toBe(owner.organization.id)
      expect(invitedLoginResponse.body.data.user.role).toBe("OWNER")

      const decoded = verifyAccessToken(invitedLoginResponse.body.data.accessToken)
      expect(decoded.organizationId).toBe(owner.organization.id)
      expect(decoded.role).toBe("OWNER")
    })
  })
})
