import { Client } from "pg"
import { syncTenantRegionCountryPool } from "./tenant-region-countries"

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

    const poolSync = await syncTenantRegionCountryPool(schema)
    report.region_country = `unassigned=${poolSync.unassigned} released=${poolSync.released} inserted=${poolSync.inserted}`

    return report
  } finally {
    await client.end()
  }
}
