import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  deleteTenantRegion,
  getTenantRegion,
  updateTenantRegion,
  type UpdateRegionInput,
} from "../../../../lib/tenant-regions"

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
    const { id } = req.params
    const region = await getTenantRegion(schema, id)

    if (!region) {
      return res.status(404).json({ message: "Región no encontrada." })
    }

    res.json({ region })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al cargar la región"
    const status = message === "TENANT_SCHEMA_REQUIRED" ? 401 : 400
    res.status(status).json({ message })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  return PUT(req, res)
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const schema = requireSchema(req)
    const { id } = req.params
    const body = req.body as UpdateRegionInput

    const region = await updateTenantRegion(schema, id, body)
    if (!region) {
      return res.status(404).json({ message: "Región no encontrada." })
    }

    res.json({ region })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al actualizar la región"
    const status = message === "TENANT_SCHEMA_REQUIRED" ? 401 : 400
    res.status(status).json({ message })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const schema = requireSchema(req)
    const { id } = req.params
    const deleted = await deleteTenantRegion(schema, id)

    if (!deleted) {
      return res.status(404).json({ message: "Región no encontrada." })
    }

    res.json({ deleted: true, id })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al eliminar la región"
    const status = message === "TENANT_SCHEMA_REQUIRED" ? 401 : 400
    res.status(status).json({ message })
  }
}
