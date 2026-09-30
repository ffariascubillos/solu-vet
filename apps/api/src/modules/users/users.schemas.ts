import { z } from "zod"

export const INVITABLE_ROLES = ["VETERINARIAN", "RECEPTIONIST", "ASSISTANT"] as const

export const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(INVITABLE_ROLES),
})

export type InviteUserInput = z.infer<typeof inviteUserSchema>
