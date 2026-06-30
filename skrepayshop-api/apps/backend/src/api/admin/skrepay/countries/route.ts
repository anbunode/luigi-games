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
import { syncTenantRegionCountryPool } from "../../../../lib/tenant-region-countries"

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

type CountryRow = {
  iso_2: string
  display_name: string
}

async function loadCountries(schema: string): Promise<CountryRow[]> {
  const schemaQ = quoteSchema(schema)
  const pool = getPlatformPool()

  await syncTenantRegionCountryPool(schema)

  const tenantResult = await pool.query<CountryRow>(
    `select distinct on (lower(iso_2))
       lower(iso_2) as iso_2,
       coalesce(nullif(display_name, ''), nullif(name, ''), upper(iso_2)) as display_name
     from ${schemaQ}.region_country
     where deleted_at is null
     order by lower(iso_2), region_id nulls first, updated_at desc`
  )

  if (tenantResult.rows.length >= 100) {
    return tenantResult.rows.sort((left, right) =>
      left.display_name.localeCompare(right.display_name, "es")
    )
  }

  const catalogResult = await pool.query<CountryRow>(
    `select distinct on (lower(iso_2))
       lower(iso_2) as iso_2,
       coalesce(nullif(display_name, ''), nullif(name, ''), upper(iso_2)) as display_name
     from public.region_country
     where deleted_at is null
     order by lower(iso_2), region_id nulls first, updated_at desc`
  )

  const merged = new Map<string, CountryRow>()

  for (const row of [...catalogResult.rows, ...tenantResult.rows]) {
    merged.set(row.iso_2.toLowerCase(), {
      iso_2: row.iso_2.toLowerCase(),
      display_name: row.display_name,
    })
  }

  return [...merged.values()].sort((left, right) =>
    left.display_name.localeCompare(right.display_name, "es")
  )
}

/**
 * GET /admin/skrepay/countries
 * Catálogo universal ISO para formularios de dirección.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const schema = await resolveRequestSchema(req)

  if (!schema) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Tenant context required"
    )
  }

  const countries = await loadCountries(schema)

  res.json({ countries })
}
