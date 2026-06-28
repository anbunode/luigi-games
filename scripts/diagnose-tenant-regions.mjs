/**
 * Diagnóstico: datos de referencia en schema tenant vs public (regiones).
 */
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
  if (process.env[name]) return process.env[name].trim()
  const raw = readFileSync(resolve(backendRoot, ".env"), "utf8")
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith(`${name}=`)) {
      return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "")
    }
  }
  return ""
}

const url = loadEnv("DATABASE_URL")
const base = process.env.API_BASE_URL || "https://skrepayshop-api.onrender.com"
const email = loadEnv("LUIGI_ADMIN_EMAIL") || loadEnv("TEST_ADMIN_EMAIL")
const password = loadEnv("LUIGI_ADMIN_PASSWORD") || loadEnv("TEST_ADMIN_PASSWORD")

const client = new pg.Client({
  connectionString: url,
  ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false },
})

await client.connect()

const tenants = await client.query(
  `select slug, database_schema, database_status, owner_email
   from public.skrepayshop_tenants order by created_at desc limit 5`
)

const publicCounts = await client.query(`
  select
    (select count(*)::int from public.currency where deleted_at is null) as currencies,
    (select count(*)::int from public.region where deleted_at is null) as regions,
    (select count(*)::int from public.payment_provider where deleted_at is null) as payment_providers
`)

console.log("public", publicCounts.rows[0])
console.log("tenants", tenants.rows)

for (const t of tenants.rows) {
  const schema =
    t.database_schema || `t_${t.slug.replace(/[^a-z0-9_]/g, "_")}`

  const counts = await client.query(`
    select
      (select count(*)::int from "${schema}".currency where deleted_at is null) as currencies,
      (select count(*)::int from "${schema}".region where deleted_at is null) as regions,
      (select count(*)::int from "${schema}".payment_provider where deleted_at is null) as payment_providers,
      (select count(*)::int from "${schema}".store where deleted_at is null) as stores,
      (select count(*)::int from "${schema}".region_country where deleted_at is null) as region_countries
  `)

  console.log(schema, counts.rows[0])
}

if (email && password) {
  const loginRes = await fetch(`${base}/skrepay/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })

  if (loginRes.ok) {
    const { token } = await loginRes.json()
    const listRes = await fetch(`${base}/admin/regions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const listBody = await listRes.text()
    console.log("GET /admin/regions", listRes.status, listBody.slice(0, 300))

    const createRes = await fetch(`${base}/admin/regions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Test Region Diagnostic",
        currency_code: "usd",
        countries: ["us"],
        payment_providers: ["pp_system_default"],
      }),
    })
    const createBody = await createRes.text()
    console.log("POST /admin/regions", createRes.status, createBody.slice(0, 500))
  } else {
    console.log("login failed", loginRes.status, await loginRes.text())
  }
} else {
  console.log("skip API test — no credentials in .env")
}

await client.end()
