import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { getPlatformPool } from "./platform-db"
import {
  resolveTenantForAdminRequest,
  resolveTenantSchema,
} from "./tenant-db-scope"

type ScopedRequest = MedusaRequest & {
  skrepayTenantSchema?: string
}

type DraftCreateBody = {
  sales_channel_id?: string
  region_id?: string
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

async function loadTenantStoreDefaults(schema: string) {
  const result = await getPlatformPool().query<{
    default_sales_channel_id: string | null
    default_location_id: string | null
  }>(
    `select default_sales_channel_id, default_location_id
     from ${quoteSchema(schema)}.store
     where deleted_at is null
     order by created_at asc
     limit 1`
  )

  return result.rows[0] ?? null
}

/**
 * Medusa draft convert needs a sales channel linked to a stocked location.
 * Tenant stores live outside public; without sales_channel_id drafts get a
 * generic channel with no stock location → "not stocked at location undefined".
 */
export async function tenantDraftOrderCreateMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const schema = await resolveRequestSchema(req)

  if (!schema) {
    next()
    return
  }

  const body = (req.body ?? {}) as DraftCreateBody
  const defaults = await loadTenantStoreDefaults(schema)

  if (!defaults?.default_sales_channel_id) {
    next()
    return
  }

  if (!body.sales_channel_id) {
    body.sales_channel_id = defaults.default_sales_channel_id
    req.body = body
  }

  next()
}
