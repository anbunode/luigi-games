import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  createTenantRegion,
  listTenantRegions,
  type CreateRegionInput,
} from "../../../lib/tenant-regions"

type ScopedRequest = MedusaRequest & {
  skrepayTenantSchema?: string
}

function requireSchema(req: MedusaRequest): string {
  const schema = (req as ScopedRequest).skrepayTenantSchema
  if (!schema) {
    throw new Error("TENANT_SCHEMA_REQUIRED")
  }
  return schema
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const schema = requireSchema(req)
    const regions = await listTenantRegions(schema)

    res.json({
      regions,
      count: regions.length,
      offset: 0,
      limit: regions.length,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al cargar regiones"
    const status = message === "TENANT_SCHEMA_REQUIRED" ? 401 : 400
    res.status(status).json({ message })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const schema = requireSchema(req)
    const body = req.body as CreateRegionInput

    const region = await createTenantRegion(schema, body)
    res.status(201).json({ region })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear la región"
    const status = message === "TENANT_SCHEMA_REQUIRED" ? 401 : 400
    res.status(status).json({ message })
  }
}
