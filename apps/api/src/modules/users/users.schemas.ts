import { z } from "zod"

export const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.literal("OWNER"),
})

export type InviteUserInput = z.infer<typeof inviteUserSchema>
