import type { NextFunction, Request, Response } from "express"
import { verifyAccessToken, type AccessTokenPayload } from "../lib/auth/access-token.js"
import { forOrganization } from "../lib/for-organization.js"
import { prisma } from "../lib/prisma.js"

const invalidTokenResponse = { ok: false, message: "Invalid or expired token" }

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({
      ok: false,
      message: "Missing or malformed Authorization header",
    })
  }

  let payload: AccessTokenPayload
  try {
    payload = verifyAccessToken(header.slice("Bearer ".length))
  } catch {
    return res.status(401).json(invalidTokenResponse)
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { organizationId: true, role: true, sessionVersion: true },
  })

  if (!user || user.sessionVersion !== payload.sessionVersion) {
    return res.status(401).json(invalidTokenResponse)
  }

  req.auth = {
    userId: payload.sub,
    organizationId: user.organizationId,
    role: user.role,
  }
  req.prisma = prisma.$extends(forOrganization(user.organizationId))

  next()
}
