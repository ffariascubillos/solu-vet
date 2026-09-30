import { randomUUID } from "node:crypto"
import express from "express"
import jwt from "jsonwebtoken"
import request from "supertest"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { signAccessToken, type AccessTokenPayload } from "../lib/auth/access-token.js"
import { prisma } from "../lib/prisma.js"
import { requireAuth } from "./require-auth.js"

function buildApp() {
  const app = express()
  app.get("/protected", requireAuth, (req, res) => {
    res.json({
      ok: true,
      auth: req.auth,
      hasScopedPrisma: Boolean(req.prisma),
    })
  })
  return app
}

describe("requireAuth", () => {
  let payload: AccessTokenPayload

  beforeAll(async () => {
    const organization = await prisma.organization.create({
      data: {
        name: "Require Auth Test Org",
        type: "INDEPENDENT",
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })

    const user = await prisma.user.create({
      data: {
        email: `require-auth-${randomUUID()}@example.com`,
        passwordHash: "irrelevant-for-this-test",
        role: "OWNER",
        organizationId: organization.id,
      },
    })

    payload = {
      sub: user.id,
      organizationId: organization.id,
      role: user.role,
      sessionVersion: user.sessionVersion,
    }
  })

  afterAll(async () => {
    await prisma.user.delete({ where: { id: payload.sub } })
    await prisma.organization.delete({ where: { id: payload.organizationId } })
  })

  it("rejects a request with no token", async () => {
    const response = await request(buildApp()).get("/protected")

    expect(response.status).toBe(401)
  })

  it("rejects a request with a malformed authorization header", async () => {
    const response = await request(buildApp())
      .get("/protected")
      .set("Authorization", "not-a-bearer-token")

    expect(response.status).toBe(401)
  })

  it("rejects a request with an expired token", async () => {
    const expiredToken = jwt.sign(payload, process.env.JWT_SECRET as string, {
      expiresIn: -10,
    })

    const response = await request(buildApp())
      .get("/protected")
      .set("Authorization", `Bearer ${expiredToken}`)

    expect(response.status).toBe(401)
  })

  it("accepts a request with a valid token and attaches req.auth and req.prisma", async () => {
    const token = signAccessToken(payload)

    const response = await request(buildApp())
      .get("/protected")
      .set("Authorization", `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.auth).toEqual({
      userId: payload.sub,
      organizationId: payload.organizationId,
      role: payload.role,
    })
    expect(response.body.hasScopedPrisma).toBe(true)
  })

  it("rejects a correctly signed token without the sessionVersion claim", async () => {
    const withoutVersion = {
      sub: payload.sub,
      organizationId: payload.organizationId,
      role: payload.role,
    }
    const token = jwt.sign(withoutVersion, process.env.JWT_SECRET as string, {
      expiresIn: "15m",
    })

    const response = await request(buildApp())
      .get("/protected")
      .set("Authorization", `Bearer ${token}`)

    expect(response.status).toBe(401)
  })

  it("rejects a token whose sessionVersion differs from the user's", async () => {
    const token = signAccessToken({ ...payload, sessionVersion: payload.sessionVersion + 1 })

    const response = await request(buildApp())
      .get("/protected")
      .set("Authorization", `Bearer ${token}`)

    expect(response.status).toBe(401)
  })

  it("rejects a token whose user does not exist", async () => {
    const token = signAccessToken({ ...payload, sub: `missing-${randomUUID()}` })

    const response = await request(buildApp())
      .get("/protected")
      .set("Authorization", `Bearer ${token}`)

    expect(response.status).toBe(401)
  })
})
