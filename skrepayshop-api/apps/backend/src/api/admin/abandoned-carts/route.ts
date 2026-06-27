import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { listAbandonedCarts } from "../../../lib/abandoned-carts"

type ScopedRequest = MedusaRequest & {
  skrepayTenantSchema?: string
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const schema = (req as ScopedRequest).skrepayTenantSchema
  const limit = Math.min(Number(req.query.limit) || 20, 100)
  const offset = Number(req.query.offset) || 0

  const { carts, count } = await listAbandonedCarts(schema, { limit, offset })

  res.json({
    abandoned_carts: carts,
    count,
    offset,
    limit,
  })
}
