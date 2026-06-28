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

const url = loadEnv("DATABASE_URL")
const client = new pg.Client({
  connectionString: url,
  ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false },
})

await client.connect()

for (const schema of ["public", "t_luigi_game"]) {
  const schemaQ = `"${schema}"`
  const regions = await client.query(
    `select id, name, currency_code, deleted_at from ${schemaQ}.region order by created_at`
  )
  console.log(`\n${schema}.region (${regions.rows.length} rows)`)
  for (const r of regions.rows) {
    console.log(`  ${r.deleted_at ? "[deleted]" : "[active]"}`, r.name, r.currency_code, r.id)
  }
}

const base = "https://skrepayshop-api.onrender.com"
const email = loadEnv("LUIGI_ADMIN_EMAIL") || "gmzulia01@gmail.com"
const password = loadEnv("LUIGI_ADMIN_PASSWORD") || loadEnv("TEST_ADMIN_PASSWORD")
const login = await fetch(`${base}/skrepay/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
})
const { token } = await login.json()
const headers = { Authorization: `Bearer ${token}` }

const regionsApi = await fetch(`${base}/admin/regions?limit=50`, { headers })
const regionsBody = await regionsApi.json()
console.log("\nGET /admin/regions", regionsApi.status)
console.log(regionsBody.regions?.map((r) => `${r.name} (${r.currency_code})`).join(", ") || "(empty)")

const pricing = await fetch(`${base}/admin/skrepay/pricing-currencies`, { headers })
const pricingBody = await pricing.json()
console.log(
  "\nGET /admin/skrepay/pricing-currencies",
  pricing.status,
  pricingBody.supported_currencies?.map((c) => c.currency_code).join(", ") || "(empty)"
)

await client.end()
