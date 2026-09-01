import { z } from "zod"

export const createPatientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  sex: z.enum(["MALE", "FEMALE"]),
  age: z.number().int().nonnegative().optional(),
  speciesId: z.string().min(1),
  breedId: z.string().min(1),
  reproductiveStatus: z.enum(["STERILIZED", "NOT_STERILIZED"]),
  tutorId: z.string().min(1),
})

export type CreatePatientInput = z.infer<typeof createPatientSchema>
