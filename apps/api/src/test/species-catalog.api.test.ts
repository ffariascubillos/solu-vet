import { randomUUID } from "node:crypto"
import { readFile } from "node:fs/promises"
import request from "supertest"
import { afterAll, afterEach, describe, expect, it } from "vitest"
import { app } from "../app.js"
import { prisma } from "../lib/prisma.js"

const EXPECTED_SPECIES = [
  "Canino",
  "Felino",
  "Lagomorfo",
  "Erizo de tierra",
  "Hurón",
  "Cobayo",
  "Hámster",
  "Reptil",
  "Ave",
  "Chinchilla",
]

const RENAME_MIGRATION_PATH = new URL(
  "../../prisma/migrations/20260928150059_rename_species_catalog_to_chilean_names/migration.sql",
  import.meta.url,
)

async function registerOwner() {
  const response = await request(app)
    .post("/api/auth/register")
    .send({
      organizationType: "INDEPENDENT",
      email: `species-catalog-test-${randomUUID()}@example.com`,
      password: "supersecret123",
      name: "Vet Owner",
    })

  return response.body.data as { accessToken: string }
}

async function createTutor(token: string) {
  const response = await request(app)
    .post("/api/tutors")
    .set("Authorization", `Bearer ${token}`)
    .send({
      firstName: "Ana",
      lastName: "Perez",
      region: "Metropolitana de Santiago",
      comuna: "Providencia",
      streetAddress: "Av. Siempre Viva 123",
      phone: "+56912345678",
      rut: "12345678-5",
    })

  return response.body.data as { id: string }
}

async function createPatient(
  token: string,
  tutorId: string,
  speciesId: string,
  breedId: string,
) {
  const response = await request(app)
    .post("/api/patients")
    .set("Authorization", `Bearer ${token}`)
    .send({
      firstName: "Luna",
      sex: "FEMALE",
      speciesId,
      breedId,
      reproductiveStatus: "STERILIZED",
      tutorId,
    })

  expect(response.status).toBe(201)

  return response.body.data as { id: string }
}

async function cleanDatabase() {
  await prisma.patient.deleteMany()
  await prisma.tutor.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()
  await prisma.organization.deleteMany()
}

describe("Species catalog API", () => {
  afterEach(async () => {
    await cleanDatabase()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it("lists exactly the Chilean species catalog", async () => {
    const response = await request(app).get("/api/species")

    expect(response.status).toBe(200)
    expect(response.body.ok).toBe(true)

    const names = response.body.data.map((species: { name: string }) => species.name)
    expect([...names].sort()).toEqual([...EXPECTED_SPECIES].sort())
    expect(names).not.toContain("Perro")
    expect(names).not.toContain("Gato")
  })

  it("returns at least one breed for every species", async () => {
    const speciesResponse = await request(app).get("/api/species")

    for (const species of speciesResponse.body.data as { id: string; name: string }[]) {
      const response = await request(app)
        .get("/api/breeds")
        .query({ speciesId: species.id })

      expect(response.status).toBe(200)
      expect(response.body.ok).toBe(true)
      expect(response.body.data.length, species.name).toBeGreaterThan(0)
    }
  })

  it("lists domestic short and long hair cat breeds without mixed breed", async () => {
    const cat = await prisma.species.findFirstOrThrow({
      where: { name: "Felino" },
    })

    const response = await request(app)
      .get("/api/breeds")
      .query({ speciesId: cat.id })

    expect(response.status).toBe(200)
    const names = response.body.data.map((breed: { name: string }) => breed.name)
    expect(names).toEqual(
      expect.arrayContaining(["Doméstico de pelo corto", "Doméstico de pelo largo"]),
    )
    expect(names).not.toContain("Mestizo / Sin raza definida")
  })

  it("rename migration keeps species and breed ids of existing patients", async () => {
    const dog = await prisma.species.findUniqueOrThrow({
      where: { name: "Canino" },
    })
    const cat = await prisma.species.findUniqueOrThrow({
      where: { name: "Felino" },
    })
    const catBreed = await prisma.breed.findFirstOrThrow({
      where: { speciesId: cat.id, name: "Doméstico de pelo corto" },
    })
    const dogBreed = await prisma.breed.findFirstOrThrow({
      where: { speciesId: dog.id },
    })

    let migrationApplied = false

    try {
      await prisma.species.update({ where: { id: dog.id }, data: { name: "Perro" } })
      await prisma.species.update({ where: { id: cat.id }, data: { name: "Gato" } })
      await prisma.breed.update({
        where: { id: catBreed.id },
        data: { name: "Mestizo / Sin raza definida" },
      })

      const owner = await registerOwner()
      const tutor = await createTutor(owner.accessToken)
      const dogPatient = await createPatient(
        owner.accessToken,
        tutor.id,
        dog.id,
        dogBreed.id,
      )
      const catPatient = await createPatient(
        owner.accessToken,
        tutor.id,
        cat.id,
        catBreed.id,
      )

      const sql = await readFile(RENAME_MIGRATION_PATH, "utf8")
      const statements = sql
        .split(";")
        .map((statement) => statement.trim())
        .filter((statement) => statement.length > 0)

      for (const statement of statements) {
        await prisma.$executeRawUnsafe(statement)
      }
      migrationApplied = true

      const migratedDog = await prisma.patient.findUniqueOrThrow({
        where: { id: dogPatient.id },
        include: { species: true },
      })
      expect(migratedDog.speciesId).toBe(dog.id)
      expect(migratedDog.species.name).toBe("Canino")

      const migratedCat = await prisma.patient.findUniqueOrThrow({
        where: { id: catPatient.id },
        include: { species: true, breed: true },
      })
      expect(migratedCat.speciesId).toBe(cat.id)
      expect(migratedCat.species.name).toBe("Felino")
      expect(migratedCat.breedId).toBe(catBreed.id)
      expect(migratedCat.breed.name).toBe("Doméstico de pelo corto")

      expect(await prisma.species.count({ where: { name: "Canino" } })).toBe(1)
      expect(
        await prisma.species.count({ where: { name: { in: ["Perro", "Gato"] } } }),
      ).toBe(0)
    } finally {
      if (!migrationApplied) {
        await prisma.species.update({ where: { id: dog.id }, data: { name: "Canino" } })
        await prisma.species.update({ where: { id: cat.id }, data: { name: "Felino" } })
        await prisma.breed.update({
          where: { id: catBreed.id },
          data: { name: "Doméstico de pelo corto" },
        })
      }
    }
  })
})
