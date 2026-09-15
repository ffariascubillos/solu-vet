import { Prisma } from "../generated/prisma/client.js"
import { prisma } from "./prisma.js"

function withOrganization(organizationId: string) {
  return async ({
    args,
    query,
  }: {
    args: any
    query: (args: any) => Promise<unknown>
  }) => {
    args.where = { ...args.where, organizationId }
    return query(args)
  }
}

export function forOrganization(organizationId: string) {
  const scope = withOrganization(organizationId)

  return Prisma.defineExtension({
    name: "forOrganization",
    query: {
      tutor: {
        findMany: scope,
        findFirst: scope,
        updateMany: scope,
        deleteMany: scope,
      },
      patient: {
        findMany: scope,
        findFirst: scope,
        updateMany: scope,
        deleteMany: scope,
      },
      consultation: {
        findMany: scope,
        findFirst: scope,
        updateMany: scope,
        deleteMany: scope,
      },
    },
  })
}

const scopedClientForTyping = prisma.$extends(forOrganization(""))
export type ScopedPrismaClient = typeof scopedClientForTyping
