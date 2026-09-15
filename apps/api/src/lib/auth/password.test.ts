import { describe, expect, it } from "vitest"
import { hashPassword, verifyPassword } from "./password.js"

describe("password hashing", () => {
  it("verifies a correct password against its hash", async () => {
    const hash = await hashPassword("correct-horse-battery-staple")

    const result = await verifyPassword("correct-horse-battery-staple", hash)

    expect(result).toBe(true)
  })

  it("does not verify an incorrect password against the hash", async () => {
    const hash = await hashPassword("correct-horse-battery-staple")

    const result = await verifyPassword("wrong-password", hash)

    expect(result).toBe(false)
  })
})
