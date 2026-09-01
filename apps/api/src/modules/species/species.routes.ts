import { Router } from "express"
import { getSpecies } from "./species.controller.js"

export const speciesRouter = Router()

speciesRouter.get("/", getSpecies)
