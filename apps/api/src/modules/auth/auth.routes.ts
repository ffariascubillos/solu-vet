import { Router } from "express"
import { requireAuth } from "../../middlewares/require-auth.js"
import {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  requestPasswordReset,
  confirmPasswordReset,
} from "./auth.controller.js"

export const authRouter = Router()

authRouter.post("/register", register)
authRouter.post("/login", login)
authRouter.post("/refresh", refresh)
authRouter.post("/logout", logout)
authRouter.post("/logout-all", requireAuth, logoutAll)
authRouter.post("/password-reset/request", requestPasswordReset)
authRouter.post("/password-reset/confirm", confirmPasswordReset)
