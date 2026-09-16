import { Router } from "express"
import { requireAuth } from "../../middlewares/require-auth.js"
import { requireRole } from "../../middlewares/require-role.js"
import { inviteUser } from "./users.controller.js"

export const usersRouter = Router()

usersRouter.post("/invite", requireAuth, requireRole("OWNER"), inviteUser)
