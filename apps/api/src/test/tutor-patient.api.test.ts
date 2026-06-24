import request from "supertest"
import { afterAll, beforeEach, describe, expect, it } from "vitest"
import { app } from "../app.js"
import { prisma } from "../lib/prisma.js"

type TutorPayload = {
  firstName: string
  lastName: string
  address: string
  email?: string
  phone: string
  rut: string
}

type PatientPayload = {
  firstName: string
  lastName?: string
  sex: "MALE" | "FEMALE"
  age?: number
  species: string
  breed?: string
  reproductiveStatus: "STERILIZED" | "NOT_STERILIZED"
  tutorId: string
}

const createTutorPayload = (
  overrides: Partial<TutorPayload> = {},
): TutorPayload => ({
  firstName: "Ana",
  lastName: "Perez",
  address: "Av. Siempre Viva 123",
  email: "ana.perez@example.com",
  phone: "+56912345678",
  rut: "12345678-5",
  ...overrides,
})

const createPatientPayload = (
  tutorId: string,
  overrides: Partial<PatientPayload> = {},
): PatientPayload => ({
  firstName: "Luna",
  lastName: "Perez",
  sex: "FEMALE",
  age: 4,
  species: "Canino",
  breed: "Mestizo",
  reproductiveStatus: "STERILIZED",
  tutorId,
  ...overrides,
})

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
      address: payload.address,
      email: payload.email,
      phone: payload.phone,
      rut: payload.rut,
    })
    expect(response.body.data.id).toEqual(expect.any(String))
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
    const payload = createPatientPayload(tutor.id)

    const response = await request(app).post("/api/patients").send(payload)

    expect(response.status).toBe(201)
    expect(response.body.ok).toBe(true)
    expect(response.body.data).toMatchObject({
      firstName: payload.firstName,
      lastName: payload.lastName,
      sex: payload.sex,
      age: payload.age,
      species: payload.species,
      breed: payload.breed,
      reproductiveStatus: payload.reproductiveStatus,
      tutorId: tutor.id,
    })
    expect(response.body.data.id).toEqual(expect.any(String))
  })

  it("returns 404 when creating a patient with a missing tutor", async () => {
    const response = await request(app)
      .post("/api/patients")
      .send(createPatientPayload("missing-tutor-id"))

    expect(response.status).toBe(404)
    expect(response.body).toMatchObject({
      ok: false,
      message: "Tutor not found",
    })
  })

  it("creates multiple patients for the same tutor", async () => {
    const tutor = await createTutor()

    const firstPatientResponse = await request(app)
      .post("/api/patients")
      .send(createPatientPayload(tutor.id, { firstName: "Luna" }))
    const secondPatientResponse = await request(app)
      .post("/api/patients")
      .send(createPatientPayload(tutor.id, { firstName: "Mora" }))

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
        createPatientPayload(tutor.id, {
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
      .send(createPatientPayload(tutor.id, { firstName: "Mora" }))
    await request(app)
      .post("/api/patients")
      .send(createPatientPayload(tutor.id, { firstName: "Nala" }))

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
      .send(createPatientPayload(tutor.id, { firstName: "Mora" }))
    await request(app)
      .post("/api/patients")
      .send(createPatientPayload(tutor.id, { firstName: "Nala" }))

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
      .send(createPatientPayload(tutor.id, { firstName: "Nala" }))
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
})
