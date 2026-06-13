import { Router } from "express"
import { createTutor, getTutors } from "./tutors.controller.js"

export const tutorsRouter = Router()

tutorsRouter.post("/", createTutor)
tutorsRouter.get("/", getTutors)
