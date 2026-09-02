import { Router } from "express"
import { tutorsRouter } from "../modules/tutors/tutors.routes.js"
import { patientsRouter } from "../modules/patients/patients.routes.js"
import { consultationsRouter } from "../modules/consultations/consultations.routes.js"
import { speciesRouter } from "../modules/species/species.routes.js"
import { breedsRouter } from "../modules/breeds/breeds.routes.js"
import { regionsRouter } from "../modules/regions/regions.routes.js"

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
router.use("/species", speciesRouter)
router.use("/breeds", breedsRouter)
router.use("/regions", regionsRouter)
