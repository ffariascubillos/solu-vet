import type { UserRole } from "../generated/prisma/client.js"
import type { ScopedPrismaClient } from "../lib/for-organization.js"

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string
        organizationId: string
        role: UserRole
      }
      prisma?: ScopedPrismaClient
    }
  }
}
