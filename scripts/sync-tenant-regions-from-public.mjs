/**
 * Copia regiones creadas en public (por fallo de search_path) al schema del tenant.
 * Uso: node scripts/sync-tenant-regions-from-public.mjs [slug]
 */
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"
import { randomBytes } from "crypto"

const slugArg = process.argv[2] || "luigi-game"
const backendRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../skrepayshop-api/apps/backend"
)
const pg = createRequire(resolve(backendRoot, "package.json"))("pg")

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

function generateEntityId(prefix = "reg") {
  const chars = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
  let id = ""
  const bytes = randomBytes(16)
  for (let i = 0; i < 26; i++) {
    id += chars[bytes[i % bytes.length] % chars.length]
  }
  return `${prefix}_${id}`
}

const RELATED_TABLES = [
  { table: "region_country", fk: "region_id" },
  { table: "region_payment_provider", fk: "region_id" },
]

const url = loadEnv("DATABASE_URL")
const client = new pg.Client({
  connectionString: url,
  ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false },
})

await client.connect()

const tenants = await client.query(
  `select slug, database_schema from public.skrepayshop_tenants where slug = $1`,
  [slugArg]
)

if (!tenants.rows.length) {
  console.error("Tenant not found:", slugArg)
  process.exit(1)
}

const schema = tenants.rows[0].database_schema
const schemaQ = quoteIdent(schema)

const publicRegions = await client.query(
  `select * from public.region where deleted_at is null order by created_at`
)

const tenantNames = await client.query(
  `select lower(name) as name from ${schemaQ}.region where deleted_at is null`
)
const existing = new Set(tenantNames.rows.map((r) => r.name))

let copied = 0

for (const region of publicRegions.rows) {
  if (existing.has(region.name.toLowerCase())) {
    console.log("skip (exists)", region.name)
    continue
  }

  const newId = generateEntityId("reg")
  await client.query("begin")

  try {
    await client.query(
      `insert into ${schemaQ}.region (
         id, name, currency_code, metadata, created_at, updated_at, deleted_at, automatic_taxes
       ) values ($1, $2, $3, $4, now(), now(), null, $5)`,
      [
        newId,
        region.name,
        region.currency_code,
        region.metadata,
        region.automatic_taxes ?? false,
      ]
    )

    for (const { table, fk } of RELATED_TABLES) {
      const exists = await client.query(
        `select to_regclass($1) as reg`,
        [`${schema}.${table}`]
      )
      if (!exists.rows[0]?.reg) continue

      const cols = await client.query(
        `select column_name from information_schema.columns
         where table_schema = $1 and table_name = $2
         order by ordinal_position`,
        [schema, table]
      )
      const columnNames = cols.rows.map((r) => r.column_name)
      if (!columnNames.includes(fk)) continue

      const rows = await client.query(
        `select * from public.${quoteIdent(table)} where ${quoteIdent(fk)} = $1`,
        [region.id]
      )

      for (const row of rows.rows) {
        const payload = { ...row, [fk]: newId }
        if (payload.id && table !== "region_country") {
          payload.id = generateEntityId(table.slice(0, 4))
        }
        const keys = Object.keys(payload).filter((k) => columnNames.includes(k))
        const values = keys.map((k) => payload[k])
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ")
        await client.query(
          `insert into ${schemaQ}.${quoteIdent(table)} (${keys.map((k) => quoteIdent(k)).join(", ")})
           values (${placeholders})`,
          values
        )
      }
    }

    await client.query("commit")
    console.log("copied", region.name, "→", newId)
    copied++
  } catch (error) {
    await client.query("rollback")
    console.error("failed", region.name, error instanceof Error ? error.message : error)
  }
}

await client.end()
console.log("\nDone.", copied, "region(s) copied.")
