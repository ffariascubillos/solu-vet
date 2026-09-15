import jwt from "jsonwebtoken"
import type { UserRole } from "../../generated/prisma/client.js"

if (!process.env.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET no está definida. Configúrala en apps/api/.env antes de arrancar la API.",
  )
}

const JWT_SECRET: string = process.env.JWT_SECRET

const ACCESS_TOKEN_EXPIRY = "15m"

export type AccessTokenPayload = {
  sub: string
  organizationId: string
  role: UserRole
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY })
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, JWT_SECRET) as unknown as AccessTokenPayload
}
