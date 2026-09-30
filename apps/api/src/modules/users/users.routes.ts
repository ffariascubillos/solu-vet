import { Router } from "express"
import { requireAuth } from "../../middlewares/require-auth.js"
import { requireRole } from "../../middlewares/require-role.js"
import { cancelInvitation, getSeats, inviteUser, removeUser } from "./users.controller.js"

export const usersRouter = Router()

usersRouter.post("/invite", requireAuth, requireRole("OWNER"), inviteUser)
usersRouter.get("/seats", requireAuth, requireRole("OWNER"), getSeats)
usersRouter.delete("/invitations/:id", requireAuth, requireRole("OWNER"), cancelInvitation)
usersRouter.delete("/:id", requireAuth, requireRole("OWNER"), removeUser)
