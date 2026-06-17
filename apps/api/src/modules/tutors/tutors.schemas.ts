import { z } from "zod"
import { isValidRut, normalizeRut } from "../../utils/rut.js"

export const createTutorSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  address: z.string().min(5),
  email: z.string().email().optional(),
  phone: z.string().min(8),
  rut: z
    .string()
    .transform(normalizeRut)
    .refine(isValidRut, { message: "Invalid Chilean RUT" }),
})

export type CreateTutorInput = z.infer<typeof createTutorSchema>
