import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"

const backendRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../skrepayshop-api/apps/backend"
)
const pg = createRequire(resolve(backendRoot, "package.json"))("pg")

function loadEnv(name) {
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

const url = loadEnv("DATABASE_URL")
const client = new pg.Client({
  connectionString: url,
  ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false },
})

await client.connect()

const tenants = await client.query(
  `select slug, database_schema, database_status from public.skrepayshop_tenants
   where slug like '%luigi%'`
)
console.log("tenants:", tenants.rows)

const allTenants = await client.query(
  `select slug, database_schema from public.skrepayshop_tenants
   where database_schema is not null
   order by created_at asc`
)

const schemas = ["public", ...allTenants.rows.map((row) => row.database_schema)]

for (const schema of schemas) {
  const exists = await client.query(`select to_regclass($1) as reg`, [
    `${schema}.stock_location`,
  ])

  if (!exists.rows[0]?.reg) {
    console.log(`\n${schema}: no stock_location table`)
    continue
  }

  const schemaQ = quoteIdent(schema)
  const counts = {}

  for (const table of [
    "stock_location",
    "fulfillment_set",
    "service_zone",
    "shipping_option",
    "shipping_profile",
    "fulfillment_provider",
    "sales_channel",
  ]) {
    const result = await client.query(
      `select count(*)::int as c from ${schemaQ}.${quoteIdent(table)} where deleted_at is null`
    )
    counts[table] = result.rows[0].c
  }

  const store = await client.query(
    `select id, default_location_id, default_sales_channel_id, default_region_id
     from ${schemaQ}.store where deleted_at is null limit 1`
  )

  const regions = await client.query(
    `select count(*)::int as c from ${schemaQ}.region where deleted_at is null`
  )

  console.log(`\n${schema}`)
  console.log("counts:", counts)
  console.log("regions:", regions.rows[0].c)
  console.log("store:", store.rows[0] ?? null)
}

await client.end()
