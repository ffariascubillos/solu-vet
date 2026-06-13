import { Router } from "express"
import { tutorsRouter } from "../modules/tutors/tutors.routes.js"
import { patientsRouter } from "../modules/patients/patients.routes.js"
import { consultationsRouter } from "../modules/consultations/consultations.routes.js"

export const router = Router()

router.get("/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    message: "API working correctly",
  })
})

router.use("/tutors", tutorsRouter)
router.use("/patients", patientsRouter)
router.use("/consultations", consultationsRouter)
