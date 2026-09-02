import { Router } from "express"
import { getRegions } from "./regions.controller.js"

export const regionsRouter = Router()

regionsRouter.get("/", getRegions)
