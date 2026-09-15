import { randomUUID } from "node:crypto"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { forOrganization } from "./for-organization.js"
import { prisma } from "./prisma.js"

describe("forOrganization", () => {
  let organizationAId: string
  let organizationBId: string
  let tutorAId: string
  let tutorBId: string

  beforeAll(async () => {
    const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    const organizationA = await prisma.organization.create({
      data: { name: "Org A", type: "INDEPENDENT", trialEndsAt },
    })
    const organizationB = await prisma.organization.create({
      data: { name: "Org B", type: "INDEPENDENT", trialEndsAt },
    })
    organizationAId = organizationA.id
    organizationBId = organizationB.id

    const tutorA = await prisma.tutor.create({
      data: {
        firstName: "Ana",
        lastName: "Org A",
        region: "Metropolitana de Santiago",
        comuna: "Providencia",
        streetAddress: "Calle 1",
        phone: "+56911111111",
        rut: `1-${randomUUID().slice(0, 6)}`,
        organizationId: organizationAId,
      },
    })
    const tutorB = await prisma.tutor.create({
      data: {
        firstName: "Beto",
        lastName: "Org B",
        region: "Metropolitana de Santiago",
        comuna: "Providencia",
        streetAddress: "Calle 2",
        phone: "+56922222222",
        rut: `2-${randomUUID().slice(0, 6)}`,
        organizationId: organizationBId,
      },
    })
    tutorAId = tutorA.id
    tutorBId = tutorB.id
  })

  afterAll(async () => {
    await prisma.tutor.deleteMany({
      where: { organizationId: { in: [organizationAId, organizationBId] } },
    })
    await prisma.organization.deleteMany({
      where: { id: { in: [organizationAId, organizationBId] } },
    })
  })

  it("findMany only returns rows from the scoped organization, even without an explicit filter", async () => {
    const scoped = prisma.$extends(forOrganization(organizationAId))

    const tutors = await scoped.tutor.findMany()

    expect(tutors.map((tutor) => tutor.id)).toEqual([tutorAId])
  })

  it("findFirst cannot find another organization's row by id", async () => {
    const scoped = prisma.$extends(forOrganization(organizationAId))

    const found = await scoped.tutor.findFirst({ where: { id: tutorBId } })

    expect(found).toBeNull()
  })

  it("updateMany only updates rows belonging to the scoped organization", async () => {
    const scoped = prisma.$extends(forOrganization(organizationAId))

    await scoped.tutor.updateMany({ where: {}, data: { lastName: "Updated" } })

    const updatedTutorA = await prisma.tutor.findUniqueOrThrow({
      where: { id: tutorAId },
    })
    const untouchedTutorB = await prisma.tutor.findUniqueOrThrow({
      where: { id: tutorBId },
    })

    expect(updatedTutorA.lastName).toBe("Updated")
    expect(untouchedTutorB.lastName).toBe("Org B")
  })
})
