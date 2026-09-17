import { randomUUID } from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import request from "supertest"
import { afterAll, beforeEach, describe, expect, it } from "vitest"
import { app } from "../app.js"
import { prisma } from "../lib/prisma.js"

const independentOwnerPayload = (overrides: Record<string, unknown> = {}) => ({
  organizationType: "INDEPENDENT",
  email: `consultations-test-${randomUUID()}@example.com`,
  password: "supersecret123",
  name: "Vet Owner",
  ...overrides,
})

async function registerOwner(overrides: Record<string, unknown> = {}) {
  const response = await request(app)
    .post("/api/auth/register")
    .send(independentOwnerPayload(overrides))

  return response.body.data as {
    accessToken: string
    refreshToken: string
    user: { id: string; email: string; name: string; role: string }
    organization: { id: string; name: string; type: string }
  }
}

async function cleanDatabase() {
  await prisma.patient.deleteMany()
  await prisma.tutor.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()
  await prisma.organization.deleteMany()
}

const createTutorPayload = (overrides: Record<string, unknown> = {}) => ({
  firstName: "Ana",
  lastName: "Perez",
  region: "Metropolitana de Santiago",
  comuna: "Providencia",
  streetAddress: "Av. Siempre Viva 123",
  email: `tutor-${randomUUID()}@example.com`,
  phone: "+56912345678",
  rut: "12345678-5",
  ...overrides,
})

async function createPatientPayloadFor(
  tutorId: string,
  overrides: Record<string, unknown> = {},
) {
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

async function createPatientForOrg(
  token: string,
  overrides: Record<string, unknown> = {},
) {
  const tutorResponse = await request(app)
    .post("/api/tutors")
    .set("Authorization", `Bearer ${token}`)
    .send(createTutorPayload())
  const tutorId = tutorResponse.body.data.id as string

  const patientPayload = await createPatientPayloadFor(tutorId, overrides)
  const patientResponse = await request(app)
    .post("/api/patients")
    .set("Authorization", `Bearer ${token}`)
    .send(patientPayload)

  return patientResponse.body.data as { id: string; tutorId: string }
}

const createConsultationPayload = (
  patientId: string,
  overrides: Record<string, unknown> = {},
) => ({
  patientId,
  consultationReason: "Chequeo general",
  homeTreatment: { instructions: "Reposo por 3 días" },
  consultationDetail: { cost: 15000 },
  ...overrides,
})

async function createConsultation(
  token: string,
  patientId: string,
  overrides: Record<string, unknown> = {},
) {
  const response = await request(app)
    .post("/api/consultations")
    .set("Authorization", `Bearer ${token}`)
    .send(createConsultationPayload(patientId, overrides))

  return response.body.data as {
    id: string
    patientId: string
    organizationId: string
    consultationReason: string
    homeTreatment: { id: string; instructions: string } | null
    consultationDetail: { id: string; cost: string } | null
    attachments: Array<{ id: string; fileUrl: string }>
  }
}

const uploadsDir = path.resolve("uploads")

function listUploadedFiles() {
  return fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : []
}

let ownerAToken: string
let organizationAId: string

describe("Consultations API tenant isolation", () => {
  beforeEach(async () => {
    await cleanDatabase()
    const ownerA = await registerOwner()
    ownerAToken = ownerA.accessToken
    organizationAId = ownerA.organization.id
  })

  afterAll(async () => {
    await cleanDatabase()
    await prisma.$disconnect()
  })

  it("returns 401 for every consultation route without an Authorization header", async () => {
    const patient = await createPatientForOrg(ownerAToken)
    const consultation = await createConsultation(ownerAToken, patient.id)

    const responses = await Promise.all([
      request(app)
        .post("/api/consultations")
        .send(createConsultationPayload(patient.id)),
      request(app).get("/api/consultations"),
      request(app).get(`/api/consultations/patient/${patient.id}`),
      request(app).get(`/api/consultations/${consultation.id}`),
      request(app)
        .patch(`/api/consultations/${consultation.id}`)
        .send({ consultationReason: "Otra razón" }),
      request(app).delete(`/api/consultations/${consultation.id}`),
      request(app).post(`/api/consultations/${consultation.id}/attachments`),
      request(app).delete("/api/consultations/attachments/missing-attachment-id"),
    ])

    for (const response of responses) {
      expect(response.status).toBe(401)
    }
  })

  it("returns 404 and does not create a consultation when patientId belongs to another organization", async () => {
    const ownerB = await registerOwner()
    const patientB = await createPatientForOrg(ownerB.accessToken)
    const countBefore = await prisma.consultation.count()

    const response = await request(app)
      .post("/api/consultations")
      .set("Authorization", `Bearer ${ownerAToken}`)
      .send(createConsultationPayload(patientB.id))

    expect(response.status).toBe(404)
    expect(response.body).toMatchObject({
      ok: false,
      message: "Patient not found",
    })

    const countAfter = await prisma.consultation.count()
    expect(countAfter).toBe(countBefore)
  })

  it("sets the organizationId of a newly created consultation so it only appears for its own organization", async () => {
    const ownerB = await registerOwner()
    const patientA = await createPatientForOrg(ownerAToken)
    const consultation = await createConsultation(ownerAToken, patientA.id)

    const responseA = await request(app)
      .get("/api/consultations")
      .set("Authorization", `Bearer ${ownerAToken}`)
    const responseB = await request(app)
      .get("/api/consultations")
      .set("Authorization", `Bearer ${ownerB.accessToken}`)

    const idsA = responseA.body.data.map((item: { id: string }) => item.id)
    const idsB = responseB.body.data.map((item: { id: string }) => item.id)

    expect(idsA).toContain(consultation.id)
    expect(idsB).not.toContain(consultation.id)
  })

  it("does not include consultations from other organizations when listing consultations", async () => {
    const patientA = await createPatientForOrg(ownerAToken)
    const consultationA = await createConsultation(ownerAToken, patientA.id)

    const ownerB = await registerOwner()
    const patientB = await createPatientForOrg(ownerB.accessToken)
    const consultationB = await createConsultation(ownerB.accessToken, patientB.id)

    const response = await request(app)
      .get("/api/consultations")
      .set("Authorization", `Bearer ${ownerAToken}`)

    expect(response.status).toBe(200)
    const ids = response.body.data.map((item: { id: string }) => item.id)
    expect(ids).toContain(consultationA.id)
    expect(ids).not.toContain(consultationB.id)
  })

  it("returns 404 when getting a consultation detail from a different organization", async () => {
    const ownerB = await registerOwner()
    const patientB = await createPatientForOrg(ownerB.accessToken)
    const consultationB = await createConsultation(ownerB.accessToken, patientB.id)

    const response = await request(app)
      .get(`/api/consultations/${consultationB.id}`)
      .set("Authorization", `Bearer ${ownerAToken}`)

    expect(response.status).toBe(404)
    expect(response.body).toMatchObject({
      ok: false,
      message: "Consultation not found",
    })
  })

  it("returns an empty history when requesting consultations by a patient from another organization", async () => {
    const ownerB = await registerOwner()
    const patientB = await createPatientForOrg(ownerB.accessToken)
    await createConsultation(ownerB.accessToken, patientB.id)

    const response = await request(app)
      .get(`/api/consultations/patient/${patientB.id}`)
      .set("Authorization", `Bearer ${ownerAToken}`)

    expect(response.status).toBe(200)
    expect(response.body.ok).toBe(true)
    expect(response.body.data).toEqual([])
  })

  it("returns 404 and leaves a consultation unchanged when updating it from a different organization", async () => {
    const ownerB = await registerOwner()
    const patientB = await createPatientForOrg(ownerB.accessToken)
    const consultationB = await createConsultation(ownerB.accessToken, patientB.id)

    const response = await request(app)
      .patch(`/api/consultations/${consultationB.id}`)
      .set("Authorization", `Bearer ${ownerAToken}`)
      .send({
        consultationReason: "Hackeado",
        homeTreatment: { instructions: "Instrucciones hackeadas" },
        consultationDetail: { cost: 99999 },
      })

    expect(response.status).toBe(404)
    expect(response.body).toMatchObject({
      ok: false,
      message: "Consultation not found",
    })

    const unchanged = await prisma.consultation.findUnique({
      where: { id: consultationB.id },
      include: { homeTreatment: true, consultationDetail: true },
    })
    expect(unchanged?.consultationReason).toBe("Chequeo general")
    expect(unchanged?.homeTreatment?.instructions).toBe("Reposo por 3 días")
    expect(Number(unchanged?.consultationDetail?.cost)).toBe(15000)
  })

  it("returns 404 and does not delete a consultation or its attachments when deleting from a different organization", async () => {
    const ownerB = await registerOwner()
    const patientB = await createPatientForOrg(ownerB.accessToken)
    const consultationB = await createConsultation(ownerB.accessToken, patientB.id)

    const uploadResponse = await request(app)
      .post(`/api/consultations/${consultationB.id}/attachments`)
      .set("Authorization", `Bearer ${ownerB.accessToken}`)
      .attach("file", Buffer.from("fake-image-content"), {
        filename: "result.png",
        contentType: "image/png",
      })
    const attachmentPath = path.resolve(
      "uploads",
      uploadResponse.body.data.fileUrl.replace("/uploads/", ""),
    )

    const response = await request(app)
      .delete(`/api/consultations/${consultationB.id}`)
      .set("Authorization", `Bearer ${ownerAToken}`)

    expect(response.status).toBe(404)
    expect(response.body).toMatchObject({
      ok: false,
      message: "Consultation not found",
    })

    const stillExists = await prisma.consultation.findUnique({
      where: { id: consultationB.id },
    })
    expect(stillExists).not.toBeNull()
    expect(fs.existsSync(attachmentPath)).toBe(true)
  })

  it("returns 404 and does not save a file when uploading an attachment to a consultation from a different organization", async () => {
    const ownerB = await registerOwner()
    const patientB = await createPatientForOrg(ownerB.accessToken)
    const consultationB = await createConsultation(ownerB.accessToken, patientB.id)
    const attachmentCountBefore = await prisma.attachment.count()
    const filesBefore = listUploadedFiles()

    const response = await request(app)
      .post(`/api/consultations/${consultationB.id}/attachments`)
      .set("Authorization", `Bearer ${ownerAToken}`)
      .attach("file", Buffer.from("fake-image-content"), {
        filename: "result.png",
        contentType: "image/png",
      })

    expect(response.status).toBe(404)
    expect(response.body).toMatchObject({
      ok: false,
      message: "Consultation not found",
    })

    const attachmentCountAfter = await prisma.attachment.count()
    expect(attachmentCountAfter).toBe(attachmentCountBefore)

    const filesAfter = listUploadedFiles()
    const newFiles = filesAfter.filter((file) => !filesBefore.includes(file))
    expect(newFiles).toHaveLength(0)
  })

  it("returns 404 and does not delete the file when deleting an attachment from a consultation of a different organization", async () => {
    const ownerB = await registerOwner()
    const patientB = await createPatientForOrg(ownerB.accessToken)
    const consultationB = await createConsultation(ownerB.accessToken, patientB.id)

    const uploadResponse = await request(app)
      .post(`/api/consultations/${consultationB.id}/attachments`)
      .set("Authorization", `Bearer ${ownerB.accessToken}`)
      .attach("file", Buffer.from("fake-image-content"), {
        filename: "result.png",
        contentType: "image/png",
      })
    const attachmentId = uploadResponse.body.data.id as string
    const attachmentPath = path.resolve(
      "uploads",
      uploadResponse.body.data.fileUrl.replace("/uploads/", ""),
    )

    const response = await request(app)
      .delete(`/api/consultations/attachments/${attachmentId}`)
      .set("Authorization", `Bearer ${ownerAToken}`)

    expect(response.status).toBe(404)
    expect(response.body).toMatchObject({
      ok: false,
      message: "Attachment not found",
    })

    const stillExists = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    })
    expect(stillExists).not.toBeNull()
    expect(fs.existsSync(attachmentPath)).toBe(true)
  })
})
