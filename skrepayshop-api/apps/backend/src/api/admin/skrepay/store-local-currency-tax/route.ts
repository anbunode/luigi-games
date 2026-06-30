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
import {
  isDefaultCurrencyTaxInclusive,
  loadStoreDefaultCurrencyCode,
} from "../../../../lib/tenant-store-currencies"

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
 * GET /admin/skrepay/store-local-currency-tax
 * Lee si la moneda por defecto tiene impuestos activos (price_preference).
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
    res.json({ enabled: false, currency_code: null, store_id: null })
    return
  }

  const currency_code = await loadStoreDefaultCurrencyCode(schema, storeId)
  const enabled = await isDefaultCurrencyTaxInclusive(
    schema,
    storeId,
    currency_code
  )

  res.json({
    enabled,
    currency_code: currency_code.toUpperCase(),
    store_id: storeId,
  })
}
