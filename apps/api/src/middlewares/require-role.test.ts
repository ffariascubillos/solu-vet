import express from "express"
import request from "supertest"
import { describe, expect, it } from "vitest"
import type { UserRole } from "../generated/prisma/client.js"
import { requireRole } from "./require-role.js"

function buildApp(role?: string) {
  const app = express()
  app.use((req, _res, next) => {
    if (role) {
      req.auth = {
        userId: "user-1",
        organizationId: "org-1",
        role: role as UserRole,
      }
    }
    next()
  })
  app.get("/owner-only", requireRole("OWNER"), (_req, res) => {
    res.json({ ok: true })
  })
  return app
}

describe("requireRole", () => {
  it("rejects a request without req.auth", async () => {
    const response = await request(buildApp()).get("/owner-only")

    expect(response.status).toBe(403)
  })

  it("rejects a request from a role that is not allowed", async () => {
    const response = await request(buildApp("STAFF")).get("/owner-only")

    expect(response.status).toBe(403)
  })

  it("allows a request from an allowed role", async () => {
    const response = await request(buildApp("OWNER")).get("/owner-only")

    expect(response.status).toBe(200)
  })
})
