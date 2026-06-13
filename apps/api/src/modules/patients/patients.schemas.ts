import { z } from "zod"

export const createPatientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  sex: z.enum(["MALE", "FEMALE"]),
  age: z.number().int().nonnegative().optional(),
  species: z.string().min(2),
  breed: z.string().optional(),
  reproductiveStatus: z.enum(["STERILIZED", "NOT_STERILIZED"]),
  tutorId: z.string().min(1),
})

export type CreatePatientInput = z.infer<typeof createPatientSchema>
