import { Client } from "pg"

/** Tablas de referencia Medusa que deben existir en cada schema tenant. */
const REFERENCE_TABLES = [
  "currency",
  "payment_provider",
  "tax_provider",
  "fulfillment_provider",
] as const

function sslForUrl(connectionString: string) {
  return connectionString.includes("localhost")
    ? undefined
    : { rejectUnauthorized: false }
}

function quoteIdent(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

/**
 * Copia datos de referencia desde public al schema tenant.
 * Sin esto el panel nativo no puede crear regiones (monedas/proveedores vacíos).
 */
export async function seedTenantReferenceData(
  connectionString: string,
  schema: string
): Promise<Record<string, string>> {
  const schemaQ = quoteIdent(schema)
  const client = new Client({
    connectionString: connectionString.split("?")[0],
    ssl: sslForUrl(connectionString),
  })

  await client.connect()
  const report: Record<string, string> = {}

  try {
    for (const table of REFERENCE_TABLES) {
      const exists = await client.query<{ reg: string | null }>(
        `select to_regclass($1) as reg`,
        [`${schema}.${table}`]
      )

      if (!exists.rows[0]?.reg) {
        report[table] = "missing_table"
        continue
      }

      const tableQ = quoteIdent(table)
      const before = await client.query<{ c: number }>(
        `select count(*)::int as c from ${schemaQ}.${tableQ}`
      )

      if (before.rows[0].c > 0) {
        report[table] = `skipped (${before.rows[0].c} rows)`
        continue
      }

      await client.query(
        `insert into ${schemaQ}.${tableQ}
         select * from public.${tableQ}`
      )

      const after = await client.query<{ c: number }>(
        `select count(*)::int as c from ${schemaQ}.${tableQ}`
      )
      report[table] = `seeded ${after.rows[0].c} rows`
    }

    await seedTenantRegionCountryPool(client, schema, schemaQ, report)

    return report
  } finally {
    await client.end()
  }
}

async function seedTenantRegionCountryPool(
  client: Client,
  schema: string,
  schemaQ: string,
  report: Record<string, string>
) {
  const exists = await client.query<{ reg: string | null }>(
    `select to_regclass($1) as reg`,
    [`${schema}.region_country`]
  )

  if (!exists.rows[0]?.reg) {
    report.region_country = "missing_table"
    return
  }

  const unassigned = await client.query<{ c: number }>(
    `select count(*)::int as c from ${schemaQ}.region_country where region_id is null`
  )

  if (unassigned.rows[0].c >= 200) {
    report.region_country = `skipped (${unassigned.rows[0].c} unassigned)`
    return
  }

  const result = await client.query(
    `insert into ${schemaQ}.region_country
       (iso_2, iso_3, num_code, name, display_name, region_id, created_at, updated_at)
     select iso_2, iso_3, num_code, name, display_name, null, now(), now()
     from public.region_country
     where region_id is null
     on conflict (iso_2) do update
       set iso_3 = excluded.iso_3,
           num_code = excluded.num_code,
           name = excluded.name,
           display_name = excluded.display_name,
           updated_at = now()
     where ${schemaQ}.region_country.region_id is null`
  )

  const after = await client.query<{ c: number }>(
    `select count(*)::int as c from ${schemaQ}.region_country where region_id is null`
  )
  report.region_country = `seeded ${after.rows[0].c} unassigned (${result.rowCount} upserted)`
}
