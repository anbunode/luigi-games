import { getPlatformPool } from "./platform-db"

function quoteSchema(schema: string): string {
  return `"${schema.replace(/"/g, '""')}"`
}

/**
 * Garantiza que el tenant tenga todo el catálogo ISO en region_country (region_id null)
 * y libera países atrapados en regiones soft-deleted.
 */
export async function syncTenantRegionCountryPool(
  schema: string
): Promise<{ unassigned: number; released: number; inserted: number }> {
  const schemaQ = quoteSchema(schema)
  const pool = getPlatformPool()

  const released = await pool.query(
    `update ${schemaQ}.region_country rc
     set region_id = null, updated_at = now()
     from ${schemaQ}.region r
     where rc.region_id = r.id
       and r.deleted_at is not null`
  )

  const inserted = await pool.query(
    `insert into ${schemaQ}.region_country
       (iso_2, iso_3, num_code, name, display_name, region_id, created_at, updated_at)
     select
       catalog.iso_2,
       catalog.iso_3,
       catalog.num_code,
       catalog.name,
       catalog.display_name,
       null,
       now(),
       now()
     from (
       select distinct on (lower(iso_2))
         iso_2, iso_3, num_code, name, display_name
       from public.region_country
       order by lower(iso_2), region_id nulls first
     ) catalog
     where not exists (
       select 1 from ${schemaQ}.region_country tenant_rc
       where lower(tenant_rc.iso_2) = lower(catalog.iso_2)
     )`
  )

  const unassigned = await pool.query<{ c: number }>(
    `select count(*)::int as c from ${schemaQ}.region_country where region_id is null`
  )

  return {
    unassigned: unassigned.rows[0]?.c ?? 0,
    released: released.rowCount ?? 0,
    inserted: inserted.rowCount ?? 0,
  }
}

/** Al eliminar una región, devuelve sus países al pool disponible. */
export async function releaseRegionCountries(
  schema: string,
  regionId: string
): Promise<void> {
  const schemaQ = quoteSchema(schema)
  await getPlatformPool().query(
    `update ${schemaQ}.region_country
     set region_id = null, updated_at = now()
     where region_id = $1`,
    [regionId]
  )
}
