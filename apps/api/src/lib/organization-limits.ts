import type { OrganizationType } from "../generated/prisma/client.js"

export const USER_LIMIT_BY_ORGANIZATION_TYPE: Record<OrganizationType, number> = {
  INDEPENDENT: 1,
  CLINIC: 5,
}
