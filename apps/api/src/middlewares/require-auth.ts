import type { NextFunction, Request, Response } from "express"
import { verifyAccessToken } from "../lib/auth/access-token.js"
import { forOrganization } from "../lib/for-organization.js"
import { prisma } from "../lib/prisma.js"

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({
      ok: false,
      message: "Missing or malformed Authorization header",
    })
  }

  const token = header.slice("Bearer ".length)

  try {
    const payload = verifyAccessToken(token)

    req.auth = {
      userId: payload.sub,
      organizationId: payload.organizationId,
      role: payload.role,
    }
    req.prisma = prisma.$extends(forOrganization(req.auth.organizationId))

    next()
  } catch {
    return res.status(401).json({
      ok: false,
      message: "Invalid or expired token",
    })
  }
}
