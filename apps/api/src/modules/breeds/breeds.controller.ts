import type { Request, Response } from "express"
import { prisma } from "../../lib/prisma.js"

export async function getBreeds(req: Request, res: Response) {
  const speciesId = req.query.speciesId

  const breeds = await prisma.breed.findMany({
    where: speciesId !== undefined ? { speciesId: String(speciesId) } : undefined,
    orderBy: [{ species: { name: "asc" } }, { name: "asc" }],
  })

  return res.json({ ok: true, data: breeds })
}
