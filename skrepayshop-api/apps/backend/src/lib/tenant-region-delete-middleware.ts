import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { getPlatformPool } from "./platform-db"
import { releaseRegionCountries } from "./tenant-region-countries"
import {
  resolveTenantForAdminRequest,
  resolveTenantSchema,
} from "./tenant-db-scope"

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

async function softDeleteTenantRegion(schema: string, regionId: string) {
  const schemaQ = quoteSchema(schema)
  const pool = getPlatformPool()

  await pool.query(
    `update ${schemaQ}.region
     set deleted_at = coalesce(deleted_at, now()), updated_at = now()
     where id = $1`,
    [regionId]
  )

  await pool.query(
    `update ${schemaQ}.store
     set default_region_id = null, updated_at = now()
     where default_region_id = $1 and deleted_at is null`,
    [regionId]
  )

  await releaseRegionCountries(schema, regionId)
}

export async function tenantRegionDeleteMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const schema = await resolveRequestSchema(req)
  const regionId = req.params.id

  if (!schema || !regionId) {
    next()
    return
  }

  const originalJson = res.json.bind(res)

  res.json = ((body: unknown) => {
    if (res.statusCode < 400) {
      softDeleteTenantRegion(schema, regionId).catch(() => undefined)
    }

    return originalJson(body)
  }) as MedusaResponse["json"]

  next()
}
