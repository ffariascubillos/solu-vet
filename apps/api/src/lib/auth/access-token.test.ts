import jwt from "jsonwebtoken"
import { describe, expect, it } from "vitest"
import {
  signAccessToken,
  verifyAccessToken,
  type AccessTokenPayload,
} from "./access-token.js"

describe("access token", () => {
  const payload: AccessTokenPayload = {
    sub: "user-1",
    organizationId: "org-1",
    role: "OWNER",
  }

  it("verifies a freshly signed token and returns its payload", () => {
    const token = signAccessToken(payload)

    const result = verifyAccessToken(token)

    expect(result).toMatchObject(payload)
  })

  it("fails to verify an expired token", () => {
    const expiredToken = jwt.sign(payload, process.env.JWT_SECRET as string, {
      expiresIn: -10,
    })

    expect(() => verifyAccessToken(expiredToken)).toThrow()
  })
})
