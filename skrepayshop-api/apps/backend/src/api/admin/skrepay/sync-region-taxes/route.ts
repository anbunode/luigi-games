/**
 * POST /admin/skrepay/sync-region-taxes
 * Repara/sincroniza tax_region + tax_rate para una región existente.
 */
import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import {
  resolveTenantForAdminRequest,
  resolveTenantSchema,
} from "../../../../lib/tenant-db-scope"
import { syncTaxesForRegion } from "../../../../lib/tenant-region-tax-sync"

type ScopedRequest = MedusaRequest & {
  skrepayTenantSchema?: string
}

async function resolveRequestSchema(req: MedusaRequest): Promise<string | null> {
  const scoped = (req as ScopedRequest).skrepayTenantSchema
  if (scoped) {
    return scoped
  }

  const tenant = await resolveTenantForAdminRequest(req)
  const schema = tenant ? resolveTenantSchema(tenant) : null

  if (schema) {
    ;(req as ScopedRequest).skrepayTenantSchema = schema
  }

  return schema
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const schema = await resolveRequestSchema(req)

  if (!schema) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Tenant context required"
    )
  }

  const body = req.body as {
    region_id?: string
    countries?: string[]
    automatic_taxes?: boolean
  }

  const regionId = body.region_id

  if (!regionId) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "region_id is required"
    )
  }

  const result = await syncTaxesForRegion(schema, regionId, {
    tenantSchema: schema,
    countryCodes: body.countries,
    automaticTaxes: body.automatic_taxes,
  })

  res.json({ result })
}
