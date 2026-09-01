import { Router } from "express"
import { getBreeds } from "./breeds.controller.js"

export const breedsRouter = Router()

breedsRouter.get("/", getBreeds)
