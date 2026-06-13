import { z } from "zod"

export const createTutorSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  address: z.string().min(5),
  email: z.string().email().optional(),
  phone: z.string().min(8),
  rut: z.string().min(8),
})

export type CreateTutorInput = z.infer<typeof createTutorSchema>
