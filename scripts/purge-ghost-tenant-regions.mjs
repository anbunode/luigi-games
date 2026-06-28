/**
 * Marca como eliminadas las regiones huérfanas del schema tenant
 * que ya no aparecen en GET /admin/regions.
 *
 * Uso: node scripts/purge-ghost-tenant-regions.mjs [slug]
 */
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"

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

const url = loadEnv("DATABASE_URL")
const base = process.env.API_BASE_URL || "https://skrepayshop-api.onrender.com"
const email = loadEnv("LUIGI_ADMIN_EMAIL") || "gmzulia01@gmail.com"
const password = loadEnv("LUIGI_ADMIN_PASSWORD") || loadEnv("TEST_ADMIN_PASSWORD")

const client = new pg.Client({
  connectionString: url,
  ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false },
})
await client.connect()

const tenants = await client.query(
  `select slug, database_schema from public.skrepayshop_tenants where slug = $1`,
  [slugArg]
)

const login = await fetch(`${base}/skrepay/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
})
const { token } = await login.json()
const headers = { Authorization: `Bearer ${token}` }

const regionsRes = await fetch(`${base}/admin/regions?limit=200`, { headers })
const regionsBody = await regionsRes.json()
const liveIds = new Set((regionsBody.regions ?? []).map((r) => r.id))

for (const tenant of tenants.rows) {
  const schema = tenant.database_schema
  const schemaQ = quoteIdent(schema)

  const rows = await client.query(
    `select id, name, currency_code from ${schemaQ}.region where deleted_at is null`
  )

  console.log(`\n${tenant.slug}: admin regions ${liveIds.size}, tenant active ${rows.rows.length}`)

  for (const row of rows.rows) {
    if (liveIds.has(row.id)) {
      console.log("  keep", row.name, row.id)
      continue
    }

    await client.query(
      `update ${schemaQ}.region set deleted_at = now(), updated_at = now() where id = $1`,
      [row.id]
    )
    await client.query(
      `update ${schemaQ}.store set default_region_id = null, updated_at = now()
       where default_region_id = $1 and deleted_at is null`,
      [row.id]
    )
    console.log("  purged", row.name, row.currency_code, row.id)
  }
}

await client.end()
console.log("\nDone.")
