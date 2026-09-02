import request from "supertest"
import { afterAll, beforeEach, describe, expect, it } from "vitest"
import { app } from "../app.js"
import { prisma } from "../lib/prisma.js"

type TutorPayload = {
  firstName: string
  lastName: string
  region: string
  comuna: string
  streetAddress: string
  email?: string
  phone: string
  rut: string
}

type PatientPayload = {
  firstName: string
  lastName?: string
  sex: "MALE" | "FEMALE"
  age?: number
  speciesId: string
  breedId: string
  reproductiveStatus: "STERILIZED" | "NOT_STERILIZED"
  tutorId: string
}

const createTutorPayload = (
  overrides: Partial<TutorPayload> = {},
): TutorPayload => ({
  firstName: "Ana",
  lastName: "Perez",
  region: "Metropolitana de Santiago",
  comuna: "Providencia",
  streetAddress: "Av. Siempre Viva 123",
  email: "ana.perez@example.com",
  phone: "+56912345678",
  rut: "12345678-5",
  ...overrides,
})

const createPatientPayload = async (
  tutorId: string,
  overrides: Partial<PatientPayload> = {},
): Promise<PatientPayload> => {
  const species = await prisma.species.findFirstOrThrow({
    where: { name: "Perro" },
  })
  const breed = await prisma.breed.findFirstOrThrow({
    where: { speciesId: species.id },
  })

  return {
    firstName: "Luna",
    lastName: "Perez",
    sex: "FEMALE",
    age: 4,
    speciesId: species.id,
    breedId: breed.id,
    reproductiveStatus: "STERILIZED",
    tutorId,
    ...overrides,
  }
}

async function cleanDatabase() {
  await prisma.patient.deleteMany()
  await prisma.tutor.deleteMany()
}

async function createTutor(overrides: Partial<TutorPayload> = {}) {
  const response = await request(app)
    .post("/api/tutors")
    .send(createTutorPayload(overrides))

  return response.body.data as { id: string }
}

describe("Tutor and Patient API", () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  afterAll(async () => {
    await cleanDatabase()
    await prisma.$disconnect()
  })

  it("creates a tutor", async () => {
    const payload = createTutorPayload()

    const response = await request(app).post("/api/tutors").send(payload)

    expect(response.status).toBe(201)
    expect(response.body.ok).toBe(true)
    expect(response.body.data).toMatchObject({
      firstName: payload.firstName,
      lastName: payload.lastName,
      region: payload.region,
      comuna: payload.comuna,
      streetAddress: payload.streetAddress,
      email: payload.email,
      phone: payload.phone,
      rut: payload.rut,
    })
    expect(response.body.data.id).toEqual(expect.any(String))
  })

  it("returns 400 when tutor comuna does not belong to the selected region", async () => {
    const response = await request(app)
      .post("/api/tutors")
      .send(
        createTutorPayload({
          region: "Metropolitana de Santiago",
          comuna: "Valparaíso",
        }),
      )

    expect(response.status).toBe(400)
    expect(response.body.ok).toBe(false)
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["comuna"],
        }),
      ]),
    )
  })

  it("returns 400 when tutor region does not exist", async () => {
    const response = await request(app)
      .post("/api/tutors")
      .send(
        createTutorPayload({
          region: "Región Inventada",
          comuna: "Providencia",
        }),
      )

    expect(response.status).toBe(400)
    expect(response.body.ok).toBe(false)
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["comuna"],
        }),
      ]),
    )
  })

  it("normalizes tutor rut before creating a tutor", async () => {
    const response = await request(app)
      .post("/api/tutors")
      .send(
        createTutorPayload({
          rut: "12.345.678-5",
        }),
      )

    expect(response.status).toBe(201)
    expect(response.body.ok).toBe(true)
    expect(response.body.data.rut).toBe("12345678-5")
  })

  it("returns 409 when tutor rut already exists", async () => {
    await createTutor()

    const response = await request(app)
      .post("/api/tutors")
      .send(
        createTutorPayload({
          email: "different.email@example.com",
        }),
      )

    expect(response.status).toBe(409)
    expect(response.body).toMatchObject({
      ok: false,
      field: "rut",
      message: "Ya existe un tutor con este RUT.",
    })
  })

  it("returns 409 when tutor email already exists", async () => {
    await createTutor()

    const response = await request(app)
      .post("/api/tutors")
      .send(
        createTutorPayload({
          rut: "11111111-1",
        }),
      )

    expect(response.status).toBe(409)
    expect(response.body).toMatchObject({
      ok: false,
      field: "email",
      message: "Ya existe un tutor con este correo.",
    })
  })

  it("returns 400 when tutor rut has an invalid check digit", async () => {
    const response = await request(app)
      .post("/api/tutors")
      .send(
        createTutorPayload({
          rut: "12345678-0",
        }),
      )

    expect(response.status).toBe(400)
    expect(response.body.ok).toBe(false)
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["rut"],
        }),
      ]),
    )
  })

  it("creates a patient when tutor exists", async () => {
    const tutor = await createTutor()
    const payload = await createPatientPayload(tutor.id)

    const response = await request(app).post("/api/patients").send(payload)

    expect(response.status).toBe(201)
    expect(response.body.ok).toBe(true)
    expect(response.body.data).toMatchObject({
      firstName: payload.firstName,
      lastName: payload.lastName,
      sex: payload.sex,
      age: payload.age,
      speciesId: payload.speciesId,
      breedId: payload.breedId,
      species: { id: payload.speciesId },
      breed: { id: payload.breedId },
      reproductiveStatus: payload.reproductiveStatus,
      tutorId: tutor.id,
    })
    expect(response.body.data.id).toEqual(expect.any(String))
  })

  it("returns 404 when creating a patient with a missing tutor", async () => {
    const response = await request(app)
      .post("/api/patients")
      .send(await createPatientPayload("missing-tutor-id"))

    expect(response.status).toBe(404)
    expect(response.body).toMatchObject({
      ok: false,
      message: "Tutor not found",
    })
  })

  it("returns 404 when patient species does not exist", async () => {
    const tutor = await createTutor()
    const payload = await createPatientPayload(tutor.id, {
      speciesId: "missing-species-id",
    })

    const response = await request(app).post("/api/patients").send(payload)

    expect(response.status).toBe(404)
    expect(response.body).toMatchObject({
      ok: false,
      message: "Species not found",
    })
  })

  it("returns 404 when patient breed does not exist", async () => {
    const tutor = await createTutor()
    const payload = await createPatientPayload(tutor.id, {
      breedId: "missing-breed-id",
    })

    const response = await request(app).post("/api/patients").send(payload)

    expect(response.status).toBe(404)
    expect(response.body).toMatchObject({
      ok: false,
      message: "Breed not found",
    })
  })

  it("returns 400 when patient breed does not match species", async () => {
    const tutor = await createTutor()
    const cat = await prisma.species.findFirstOrThrow({
      where: { name: "Gato" },
    })
    const dogBreed = await prisma.breed.findFirstOrThrow({
      where: { species: { name: "Perro" } },
    })
    const payload = await createPatientPayload(tutor.id, {
      speciesId: cat.id,
      breedId: dogBreed.id,
    })

    const response = await request(app).post("/api/patients").send(payload)

    expect(response.status).toBe(400)
    expect(response.body).toMatchObject({
      ok: false,
      field: "breedId",
      message: "Breed does not match patient species",
    })
  })

  it("returns 400 when creating a patient without species or breed", async () => {
    const tutor = await createTutor()
    const payload = await createPatientPayload(tutor.id)
    const { speciesId, breedId, ...payloadWithoutSpeciesAndBreed } = payload

    const response = await request(app)
      .post("/api/patients")
      .send(payloadWithoutSpeciesAndBreed)

    expect(response.status).toBe(400)
    expect(response.body.ok).toBe(false)
  })

  it("updates a patient", async () => {
    const tutor = await createTutor()
    const createResponse = await request(app)
      .post("/api/patients")
      .send(await createPatientPayload(tutor.id))
    const patientId = createResponse.body.data.id as string

    const updatePayload = await createPatientPayload(tutor.id, {
      firstName: "Nala",
      age: 6,
    })

    const response = await request(app)
      .put(`/api/patients/${patientId}`)
      .send(updatePayload)

    expect(response.status).toBe(200)
    expect(response.body.ok).toBe(true)
    expect(response.body.data).toMatchObject({
      id: patientId,
      firstName: "Nala",
      age: 6,
    })
  })

  it("returns 404 when updating a missing patient", async () => {
    const tutor = await createTutor()

    const response = await request(app)
      .put("/api/patients/missing-patient-id")
      .send(await createPatientPayload(tutor.id))

    expect(response.status).toBe(404)
    expect(response.body).toMatchObject({
      ok: false,
      message: "Patient not found",
    })
  })

  it("returns 404 when updating a patient with a missing tutor", async () => {
    const tutor = await createTutor()
    const createResponse = await request(app)
      .post("/api/patients")
      .send(await createPatientPayload(tutor.id))
    const patientId = createResponse.body.data.id as string

    const response = await request(app)
      .put(`/api/patients/${patientId}`)
      .send(await createPatientPayload("missing-tutor-id"))

    expect(response.status).toBe(404)
    expect(response.body).toMatchObject({
      ok: false,
      message: "Tutor not found",
    })
  })

  it("returns 404 when updating a patient with a missing species", async () => {
    const tutor = await createTutor()
    const createResponse = await request(app)
      .post("/api/patients")
      .send(await createPatientPayload(tutor.id))
    const patientId = createResponse.body.data.id as string

    const response = await request(app)
      .put(`/api/patients/${patientId}`)
      .send(
        await createPatientPayload(tutor.id, {
          speciesId: "missing-species-id",
        }),
      )

    expect(response.status).toBe(404)
    expect(response.body).toMatchObject({
      ok: false,
      message: "Species not found",
    })
  })

  it("returns 404 when updating a patient with a missing breed", async () => {
    const tutor = await createTutor()
    const createResponse = await request(app)
      .post("/api/patients")
      .send(await createPatientPayload(tutor.id))
    const patientId = createResponse.body.data.id as string

    const response = await request(app)
      .put(`/api/patients/${patientId}`)
      .send(
        await createPatientPayload(tutor.id, {
          breedId: "missing-breed-id",
        }),
      )

    expect(response.status).toBe(404)
    expect(response.body).toMatchObject({
      ok: false,
      message: "Breed not found",
    })
  })

  it("returns 400 when updating a patient with a breed that does not match species", async () => {
    const tutor = await createTutor()
    const createResponse = await request(app)
      .post("/api/patients")
      .send(await createPatientPayload(tutor.id))
    const patientId = createResponse.body.data.id as string

    const cat = await prisma.species.findFirstOrThrow({
      where: { name: "Gato" },
    })
    const dogBreed = await prisma.breed.findFirstOrThrow({
      where: { species: { name: "Perro" } },
    })

    const response = await request(app)
      .put(`/api/patients/${patientId}`)
      .send(
        await createPatientPayload(tutor.id, {
          speciesId: cat.id,
          breedId: dogBreed.id,
        }),
      )

    expect(response.status).toBe(400)
    expect(response.body).toMatchObject({
      ok: false,
      field: "breedId",
      message: "Breed does not match patient species",
    })
  })

  it("creates multiple patients for the same tutor", async () => {
    const tutor = await createTutor()

    const firstPatientResponse = await request(app)
      .post("/api/patients")
      .send(await createPatientPayload(tutor.id, { firstName: "Luna" }))
    const secondPatientResponse = await request(app)
      .post("/api/patients")
      .send(await createPatientPayload(tutor.id, { firstName: "Mora" }))

    expect(firstPatientResponse.status).toBe(201)
    expect(secondPatientResponse.status).toBe(201)
    expect(firstPatientResponse.body.data.tutorId).toBe(tutor.id)
    expect(secondPatientResponse.body.data.tutorId).toBe(tutor.id)
  })

  it("searches patients by patient first and last name", async () => {
    const tutor = await createTutor({
      firstName: "Camila",
      lastName: "Rojas",
      email: "camila.rojas@example.com",
      rut: "22222222-2",
    })

    await request(app)
      .post("/api/patients")
      .send(
        await createPatientPayload(tutor.id, {
          firstName: "Mora",
          lastName: "Campos",
        }),
      )

    const patientNameResponse = await request(app)
      .get("/api/patients/search")
      .query({ q: "Mora" })

    expect(patientNameResponse.status).toBe(200)
    expect(patientNameResponse.body.ok).toBe(true)
    expect(patientNameResponse.body.data).toHaveLength(1)
    expect(patientNameResponse.body.data[0]).toMatchObject({
      firstName: "Mora",
      tutor: {
        lastName: "Rojas",
      },
    })

    const patientLastNameResponse = await request(app)
      .get("/api/patients/search")
      .query({ q: "Campos" })

    expect(patientLastNameResponse.status).toBe(200)
    expect(patientLastNameResponse.body.ok).toBe(true)
    expect(patientLastNameResponse.body.data).toHaveLength(1)
    expect(patientLastNameResponse.body.data[0].lastName).toBe("Campos")
  })

  it("searches tutors by name and rut with their patients", async () => {
    const tutor = await createTutor({
      firstName: "Camila",
      lastName: "Rojas",
      email: "camila.rojas@example.com",
      rut: "22222222-2",
    })

    await request(app)
      .post("/api/patients")
      .send(await createPatientPayload(tutor.id, { firstName: "Mora" }))
    await request(app)
      .post("/api/patients")
      .send(await createPatientPayload(tutor.id, { firstName: "Nala" }))

    const tutorNameResponse = await request(app)
      .get("/api/tutors/search")
      .query({ q: "Rojas" })

    expect(tutorNameResponse.status).toBe(200)
    expect(tutorNameResponse.body.ok).toBe(true)
    expect(tutorNameResponse.body.data).toHaveLength(1)
    expect(tutorNameResponse.body.data[0]).toMatchObject({
      id: tutor.id,
      firstName: "Camila",
      lastName: "Rojas",
    })
    expect(tutorNameResponse.body.data[0].patients).toHaveLength(2)

    const tutorRutResponse = await request(app)
      .get("/api/tutors/search")
      .query({ q: "22222222" })

    expect(tutorRutResponse.status).toBe(200)
    expect(tutorRutResponse.body.ok).toBe(true)
    expect(tutorRutResponse.body.data).toHaveLength(1)
    expect(tutorRutResponse.body.data[0].rut).toBe("22222222-2")
  })

  it("gets tutor detail with patients", async () => {
    const tutor = await createTutor({
      firstName: "Camila",
      lastName: "Rojas",
      email: "camila.rojas@example.com",
      rut: "22222222-2",
    })

    await request(app)
      .post("/api/patients")
      .send(await createPatientPayload(tutor.id, { firstName: "Mora" }))
    await request(app)
      .post("/api/patients")
      .send(await createPatientPayload(tutor.id, { firstName: "Nala" }))

    const response = await request(app).get(`/api/tutors/${tutor.id}`)

    expect(response.status).toBe(200)
    expect(response.body.ok).toBe(true)
    expect(response.body.data).toMatchObject({
      id: tutor.id,
      firstName: "Camila",
      lastName: "Rojas",
    })
    expect(response.body.data.patients).toHaveLength(2)
    const patientNames = response.body.data.patients.map(
      (patient: { firstName: string }) => patient.firstName,
    )

    expect(patientNames).toEqual(["Nala", "Mora"])
  })

  it("returns 404 when tutor detail is missing", async () => {
    const response = await request(app).get("/api/tutors/missing-tutor-id")

    expect(response.status).toBe(404)
    expect(response.body).toMatchObject({
      ok: false,
      message: "Tutor not found",
    })
  })

  it("updates a tutor", async () => {
    const tutor = await createTutor()

    const response = await request(app)
      .put(`/api/tutors/${tutor.id}`)
      .send(
        createTutorPayload({
          firstName: "Andrea",
          phone: "+56987654321",
        }),
      )

    expect(response.status).toBe(200)
    expect(response.body.ok).toBe(true)
    expect(response.body.data).toMatchObject({
      id: tutor.id,
      firstName: "Andrea",
      phone: "+56987654321",
    })
  })

  it("returns 404 when updating a missing tutor", async () => {
    const response = await request(app)
      .put("/api/tutors/missing-tutor-id")
      .send(createTutorPayload())

    expect(response.status).toBe(404)
    expect(response.body).toMatchObject({
      ok: false,
      message: "Tutor not found",
    })
  })

  it("returns 409 when updating a tutor to a rut used by another tutor", async () => {
    const tutorA = await createTutor({ rut: "11111111-1" })
    await createTutor({
      rut: "22222222-2",
      email: "other@example.com",
    })

    const response = await request(app)
      .put(`/api/tutors/${tutorA.id}`)
      .send(createTutorPayload({ rut: "22222222-2" }))

    expect(response.status).toBe(409)
    expect(response.body).toMatchObject({
      ok: false,
      field: "rut",
      message: "Ya existe un tutor con este RUT.",
    })
  })

  it("returns 409 when updating a tutor to an email used by another tutor", async () => {
    const tutorA = await createTutor({ rut: "11111111-1" })
    await createTutor({
      rut: "22222222-2",
      email: "other@example.com",
    })

    const response = await request(app)
      .put(`/api/tutors/${tutorA.id}`)
      .send(
        createTutorPayload({
          rut: "11111111-1",
          email: "other@example.com",
        }),
      )

    expect(response.status).toBe(409)
    expect(response.body).toMatchObject({
      ok: false,
      field: "email",
      message: "Ya existe un tutor con este correo.",
    })
  })

  it("allows updating a tutor while keeping its own rut and email", async () => {
    const payload = createTutorPayload()
    const tutor = await createTutor(payload)

    const response = await request(app)
      .put(`/api/tutors/${tutor.id}`)
      .send(createTutorPayload({ ...payload, streetAddress: "Nueva Direccion 456" }))

    expect(response.status).toBe(200)
    expect(response.body.ok).toBe(true)
    expect(response.body.data).toMatchObject({
      id: tutor.id,
      rut: payload.rut,
      email: payload.email,
      streetAddress: "Nueva Direccion 456",
    })
  })

  it("returns 400 when updated tutor comuna does not belong to the selected region", async () => {
    const tutor = await createTutor()

    const response = await request(app)
      .put(`/api/tutors/${tutor.id}`)
      .send(
        createTutorPayload({
          region: "Metropolitana de Santiago",
          comuna: "Valparaíso",
        }),
      )

    expect(response.status).toBe(400)
    expect(response.body.ok).toBe(false)
    expect(response.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: ["comuna"] })]),
    )
  })

  it("returns 400 when updated tutor rut has an invalid check digit", async () => {
    const tutor = await createTutor()

    const response = await request(app)
      .put(`/api/tutors/${tutor.id}`)
      .send(createTutorPayload({ rut: "12345678-0" }))

    expect(response.status).toBe(400)
    expect(response.body.ok).toBe(false)
    expect(response.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: ["rut"] })]),
    )
  })

  it("returns 400 when tutor search query is missing", async () => {
    const response = await request(app).get("/api/tutors/search")

    expect(response.status).toBe(400)
    expect(response.body).toMatchObject({
      ok: false,
      message: "Query parameter q is required",
    })
  })

  it("returns 400 when patient search query is missing", async () => {
    const response = await request(app).get("/api/patients/search")

    expect(response.status).toBe(400)
    expect(response.body).toMatchObject({
      ok: false,
      message: "Query parameter q is required",
    })
  })

  it("gets patient detail with tutor and consultations", async () => {
    const tutor = await createTutor({
      email: "detail.tutor@example.com",
      rut: "9876543-3",
    })
    const createPatientResponse = await request(app)
      .post("/api/patients")
      .send(await createPatientPayload(tutor.id, { firstName: "Nala" }))
    const patientId = createPatientResponse.body.data.id as string

    const response = await request(app).get(`/api/patients/${patientId}`)

    expect(response.status).toBe(200)
    expect(response.body.ok).toBe(true)
    expect(response.body.data).toMatchObject({
      id: patientId,
      firstName: "Nala",
      tutor: {
        id: tutor.id,
      },
    })
    expect(response.body.data.consultations).toEqual([])
  })

  it("gets the seeded species catalog", async () => {
    const response = await request(app).get("/api/species")

    expect(response.status).toBe(200)
    expect(response.body.ok).toBe(true)
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Perro" }),
        expect.objectContaining({ name: "Gato" }),
      ]),
    )
  })

  it("filters breeds by speciesId", async () => {
    const dog = await prisma.species.findFirstOrThrow({
      where: { name: "Perro" },
    })
    const cat = await prisma.species.findFirstOrThrow({
      where: { name: "Gato" },
    })

    const response = await request(app)
      .get("/api/breeds")
      .query({ speciesId: dog.id })

    expect(response.status).toBe(200)
    expect(response.body.ok).toBe(true)
    expect(response.body.data.length).toBeGreaterThan(0)
    for (const breed of response.body.data) {
      expect(breed.speciesId).toBe(dog.id)
      expect(breed.speciesId).not.toBe(cat.id)
    }
  })

  it("gets the region and comuna catalog", async () => {
    const response = await request(app).get("/api/regions")

    expect(response.status).toBe(200)
    expect(response.body.ok).toBe(true)
    expect(response.body.data.length).toBe(16)
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Metropolitana de Santiago",
          comunas: expect.arrayContaining(["Providencia"]),
        }),
      ]),
    )
  })
})
