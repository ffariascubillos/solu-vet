import type { Request, Response } from "express"
import { prisma } from "../../lib/prisma.js"

export async function getSpecies(_req: Request, res: Response) {
  const species = await prisma.species.findMany({
    orderBy: { name: "asc" },
  })

  return res.json({ ok: true, data: species })
}
