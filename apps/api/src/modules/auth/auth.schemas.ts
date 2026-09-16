import { z } from "zod"

export const registerSchema = z.discriminatedUnion("organizationType", [
  z.object({
    organizationType: z.literal("INDEPENDENT"),
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
  }),
  z.object({
    organizationType: z.literal("CLINIC"),
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
    organizationName: z.string().min(2),
  }),
])

export type RegisterInput = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export type LoginInput = z.infer<typeof loginSchema>

export const refreshSchema = z.object({
  refreshToken: z.string(),
})

export type RefreshInput = z.infer<typeof refreshSchema>

export const logoutSchema = z.object({
  refreshToken: z.string(),
})

export type LogoutInput = z.infer<typeof logoutSchema>

export const passwordResetRequestSchema = z.object({
  email: z.string().email(),
})

export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>

export const passwordResetConfirmSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
})

export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>
