import { z } from "zod"
import { isValidRut, normalizeRut } from "../../utils/rut.js"
import { isValidRegionComuna } from "../../data/chile-regions.js"

export const createTutorSchema = z
  .object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    region: z.string(),
    comuna: z.string(),
    streetAddress: z.string().min(5),
    addressComplement: z.string().trim().optional(),
    email: z.string().email().optional(),
    phone: z.string().min(8),
    rut: z
      .string()
      .transform(normalizeRut)
      .refine(isValidRut, { message: "Invalid Chilean RUT" }),
  })
  .refine((data) => isValidRegionComuna(data.region, data.comuna), {
    message: "Comuna does not belong to the selected region",
    path: ["comuna"],
  })

export type CreateTutorInput = z.infer<typeof createTutorSchema>

export const updateTutorSchema = z
  .object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    region: z.string(),
    comuna: z.string(),
    streetAddress: z.string().min(5),
    addressComplement: z.string().trim().optional(),
    email: z.string().email().optional(),
    phone: z.string().min(8),
    rut: z
      .string()
      .transform(normalizeRut)
      .refine(isValidRut, { message: "Invalid Chilean RUT" }),
  })
  .refine((data) => isValidRegionComuna(data.region, data.comuna), {
    message: "Comuna does not belong to the selected region",
    path: ["comuna"],
  })

export type UpdateTutorInput = z.infer<typeof updateTutorSchema>
