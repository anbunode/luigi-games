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

type DraftRow = {
  region_id?: string | null
  sales_channel_id?: string | null
  customer_id?: string | null
  email?: string | null
  region?: { id?: string; name?: string } | null
  sales_channel?: { id?: string; name?: string } | null
  customer?: { id?: string; email?: string } | null
  currency_code?: string | null
  total?: number | null
}

type ValidatedRequest = MedusaRequest & {
  validatedBody?: DraftCreateBody
}

function patchDraftRelations<T extends DraftRow>(draft: T): T {
  const next = { ...draft }

  if (next.region_id && !next.region) {
    next.region = { id: next.region_id, name: "—" }
  } else if (next.region && !next.region.name) {
    next.region = { ...next.region, name: "—" }
  }

  if (next.sales_channel_id && !next.sales_channel) {
    next.sales_channel = { id: next.sales_channel_id, name: "—" }
  } else if (next.sales_channel && !next.sales_channel.name) {
    next.sales_channel = { ...next.sales_channel, name: "—" }
  }

  if (next.customer_id && !next.customer) {
    next.customer = {
      id: next.customer_id,
      email: typeof next.email === "string" && next.email.trim() ? next.email : "—",
    }
  } else if (next.customer && !next.customer.email) {
    next.customer = {
      ...next.customer,
      email:
        typeof next.email === "string" && next.email.trim() ? next.email : "—",
    }
  }

  if (!next.currency_code) {
    next.currency_code = "usd"
  }

  if (next.total == null) {
    next.total = 0
  }

  return next
}

function patchDraftListBody(body: unknown): unknown {
  if (!body || typeof body !== "object") {
    return body
  }

  const record = body as Record<string, unknown>

  if (Array.isArray(record.draft_orders)) {
    return {
      ...record,
      draft_orders: record.draft_orders.map((row) =>
        patchDraftRelations(row as DraftRow)
      ),
    }
  }

  if (record.draft_order && typeof record.draft_order === "object") {
    return {
      ...record,
      draft_order: patchDraftRelations(record.draft_order as DraftRow),
    }
  }

  return body
}

export async function tenantDraftOrdersGetMiddleware(
  _req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const originalJson = res.json.bind(res)

  res.json = ((body: unknown) => originalJson(patchDraftListBody(body))) as typeof res.json

  next()
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

    const validated = (req as ValidatedRequest).validatedBody
    if (validated && !validated.sales_channel_id) {
      validated.sales_channel_id = defaults.default_sales_channel_id
    }
  }

  next()
}

export async function tenantDraftOrderConvertMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const schema = await resolveRequestSchema(req)
  const id = typeof req.params?.id === "string" ? req.params.id : null

  if (!schema || !id) {
    next()
    return
  }

  const defaults = await loadTenantStoreDefaults(schema)

  if (!defaults?.default_sales_channel_id) {
    next()
    return
  }

  await getPlatformPool().query(
    `update public."order"
     set sales_channel_id = $2, updated_at = now()
     where id = $1
       and status = 'draft'
       and deleted_at is null
       and (sales_channel_id is null or sales_channel_id <> $2)`,
    [id, defaults.default_sales_channel_id]
  )

  next()
}
