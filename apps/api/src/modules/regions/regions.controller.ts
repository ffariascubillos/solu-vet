import type { Request, Response } from "express"
import { CHILE_REGIONS } from "../../data/chile-regions.js"

export function getRegions(_req: Request, res: Response) {
  return res.json({ ok: true, data: CHILE_REGIONS })
}
