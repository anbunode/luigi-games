import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"

const slug = process.argv[2] || "luigi-game"
const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../skrepayshop-api/apps/backend")
const pg = createRequire(resolve(backendRoot, "package.json"))("pg")

function loadEnv(name) {
  const raw = readFileSync(resolve(backendRoot, ".env"), "utf8")
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith(`${name}=`)) return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "")
  }
  return ""
}

const url = loadEnv("DATABASE_URL")
const base = "https://skrepayshop-api.onrender.com"
const email = loadEnv("LUIGI_ADMIN_EMAIL") || "gmzulia01@gmail.com"
const password = loadEnv("LUIGI_ADMIN_PASSWORD") || loadEnv("TEST_ADMIN_PASSWORD")

const client = new pg.Client({
  connectionString: url,
  ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false },
})
await client.connect()

const tenant = await client.query(
  `select database_schema from public.skrepayshop_tenants where slug = $1`,
  [slug]
)
const schema = tenant.rows[0]?.database_schema
if (!schema) {
  console.error("tenant not found")
  process.exit(1)
}

const tables = await client.query(
  `select tablename from pg_tables
   where schemaname = $1
   order by tablename`,
  [schema]
)

console.log("\n=== DB TABLES WITH DATA ===")
for (const { tablename } of tables.rows) {
  const cols = await client.query(
    `select column_name from information_schema.columns
     where table_schema = $1 and table_name = $2 and column_name = 'deleted_at'`,
    [schema, tablename]
  )
  const where = cols.rowCount > 0 ? "where deleted_at is null" : ""
  const count = await client.query(
    `select count(*)::int as c from "${schema}"."${tablename}" ${where}`
  )
  if (count.rows[0].c > 0) {
    console.log(`${tablename}: ${count.rows[0].c}`)
  }
}

for (const pubTable of ["region", "tax_region", "tax_rate", "region_country"]) {
  const cols = await client.query(
    `select column_name from information_schema.columns
     where table_schema = 'public' and table_name = $1 and column_name = 'deleted_at'`,
    [pubTable]
  )
  if (cols.rowCount === 0) continue
  const count = await client.query(
    `select count(*)::int as c from public."${pubTable}" where deleted_at is null`
  )
  if (count.rows[0].c > 0) {
    console.log(`public.${pubTable}: ${count.rows[0].c}`)
  }
}

const login = await fetch(`${base}/skrepay/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
})
const { token } = await login.json()
const bridge = await fetch(`${base}/skrepay/session-bridge?token=${encodeURIComponent(token)}`, { redirect: "manual" })
const cookie = (bridge.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ")
const h = { Cookie: cookie }

console.log("\n=== ADMIN API ===")
for (const path of [
  "/admin/stores",
  "/admin/regions?limit=50",
  "/admin/tax-regions?limit=50",
  "/admin/price-preferences?limit=50",
  "/admin/currencies?limit=5",
]) {
  const res = await fetch(`${base}${path}`, { headers: h })
  const body = await res.json()
  let summary = res.status
  if (body.stores) summary += ` stores=${body.stores.length} currencies=${body.stores[0]?.supported_currencies?.length}`
  if (body.regions) summary += ` regions=${body.regions.length}`
  if (body.tax_regions) summary += ` tax_regions=${body.tax_regions.length}`
  if (body.price_preferences) summary += ` price_preferences=${body.price_preferences.length}`
  if (body.currencies) summary += ` currencies=${body.currencies.length}`
  console.log(path, summary)
}

await client.end()
