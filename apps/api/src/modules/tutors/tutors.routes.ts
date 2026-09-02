import { Router } from "express"
import {
  createTutor,
  getTutorById,
  getTutors,
  searchTutors,
  updateTutor,
} from "./tutors.controller.js"

export const tutorsRouter = Router()

tutorsRouter.post("/", createTutor)
tutorsRouter.get("/search", searchTutors)
tutorsRouter.get("/", getTutors)
tutorsRouter.get("/:id", getTutorById)
tutorsRouter.put("/:id", updateTutor)
