import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import {
  resolveTenantForAdminRequest,
  resolveTenantSchema,
} from "../../../../lib/tenant-db-scope"
import { getPlatformPool } from "../../../../lib/platform-db"
import { loadMasterCurrencyCatalogForAdmin } from "../../../../lib/tenant-store-currencies"

type ScopedRequest = MedusaRequest & {
  skrepayTenantSchema?: string
}

function quoteSchema(schema: string): string {
  return `"${schema.replace(/"/g, '""')}"`
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

/**
 * GET /admin/skrepay/region-currencies
 * Catálogo completo para crear/editar regiones — aislado de /admin/stores.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const schema = await resolveRequestSchema(req)

  if (!schema) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Tenant context required"
    )
  }

  const stores = await getPlatformPool().query<{ id: string }>(
    `select id from ${quoteSchema(schema)}.store where deleted_at is null order by created_at asc limit 1`
  )

  const storeId = stores.rows[0]?.id

  if (!storeId) {
    res.json({ supported_currencies: [], store_id: null })
    return
  }

  const supported_currencies = await loadMasterCurrencyCatalogForAdmin(
    schema,
    storeId
  )

  res.json({
    supported_currencies,
    store_id: storeId,
  })
}
