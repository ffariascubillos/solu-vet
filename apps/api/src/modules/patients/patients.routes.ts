import { Router } from "express"
import {
  createPatient,
  getPatientById,
  getPatients,
  searchPatients,
} from "./patients.controller.js"

export const patientsRouter = Router()

patientsRouter.post("/", createPatient)
patientsRouter.get("/", getPatients)
patientsRouter.get("/search", searchPatients)
patientsRouter.get("/:id", getPatientById)
