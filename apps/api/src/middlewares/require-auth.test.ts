import express from "express"
import jwt from "jsonwebtoken"
import request from "supertest"
import { describe, expect, it } from "vitest"
import { signAccessToken, type AccessTokenPayload } from "../lib/auth/access-token.js"
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
  const payload: AccessTokenPayload = {
    sub: "user-1",
    organizationId: "org-1",
    role: "OWNER",
  }

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
})
