/**
 * Copia monedas y payment providers de public → schema tenant.
 * Necesario para crear regiones en el panel Medusa nativo.
 *
 * Uso:
 *   node scripts/repair-tenant-reference-data.mjs           # todos los tenants
 *   node scripts/repair-tenant-reference-data.mjs luigi-game # uno solo
 */
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"

const slugArg = process.argv[2]
const backendRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../skrepayshop-api/apps/backend"
)
const pg = createRequire(resolve(backendRoot, "package.json"))("pg")

const REFERENCE_TABLES = [
  "currency",
  "payment_provider",
  "tax_provider",
  "fulfillment_provider",
]

function loadEnv(name) {
  if (process.env[name]) return process.env[name].trim()
  const raw = readFileSync(resolve(backendRoot, ".env"), "utf8")
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith(`${name}=`)) {
      return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "")
    }
  }
  return ""
}

function quoteIdent(value) {
  return `"${value.replace(/"/g, '""')}"`
}

async function seedReferenceData(client, schema) {
  const schemaQ = quoteIdent(schema)
  const report = {}

  for (const table of REFERENCE_TABLES) {
    const exists = await client.query(
      `select to_regclass($1) as reg`,
      [`${schema}.${table}`]
    )

    if (!exists.rows[0]?.reg) {
      report[table] = "missing_table"
      continue
    }

    const before = await client.query(
      `select count(*)::int as c from ${schemaQ}.${quoteIdent(table)}`
    )

    if (before.rows[0].c > 0) {
      report[table] = `skipped (${before.rows[0].c} rows)`
      continue
    }

    await client.query(
      `insert into ${schemaQ}.${quoteIdent(table)}
       select * from public.${quoteIdent(table)}`
    )

    const after = await client.query(
      `select count(*)::int as c from ${schemaQ}.${quoteIdent(table)}`
    )
    report[table] = `seeded ${after.rows[0].c} rows`
  }

  return report
}

const url = loadEnv("DATABASE_URL")
const client = new pg.Client({
  connectionString: url,
  ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false },
})

await client.connect()

const tenants = slugArg
  ? await client.query(
      `select slug, database_schema from public.skrepayshop_tenants where slug = $1`,
      [slugArg]
    )
  : await client.query(
      `select slug, database_schema from public.skrepayshop_tenants
       where database_schema is not null and database_status = 'active'
       order by created_at asc`
    )

for (const tenant of tenants.rows) {
  const schema =
    tenant.database_schema || `t_${tenant.slug.replace(/[^a-z0-9_]/g, "_")}`

  console.log(`\n${tenant.slug} → ${schema}`)
  try {
    const report = await seedReferenceData(client, schema)
    console.log(report)
  } catch (error) {
    console.error("  ERROR:", error instanceof Error ? error.message : error)
  }
}

await client.end()
console.log("\nDone.")
