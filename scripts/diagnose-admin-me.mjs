/**
 * Diagnóstico: por qué /admin/users/me devuelve 404 para tenant schema.
 */
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const backendRoot = resolve(root, "skrepayshop-api/apps/backend")
const pg = createRequire(resolve(backendRoot, "package.json"))("pg")
const base = process.env.API_BASE_URL || "https://skrepayshop-api.onrender.com"
const schema = "t_luigi_games"

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

const email = loadEnv("LUIGI_ADMIN_EMAIL") || "gmzulia01@gmail.com"
const password = loadEnv("LUIGI_ADMIN_PASSWORD") || loadEnv("TEST_ADMIN_PASSWORD")

const loginRes = await fetch(`${base}/skrepay/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
})

const { token } = await loginRes.json()
const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString())
const actorId = payload.actor_id
const tenantSlug = payload.app_metadata?.tenant_slug

const db = new pg.Client({
  connectionString: loadEnv("DATABASE_URL"),
  ssl: { rejectUnauthorized: false },
})
await db.connect()

const inTenant = await db.query(
  `select id, email from "${schema}"."user" where id = $1 and deleted_at is null`,
  [actorId]
)
const inPublic = await db.query(
  `select id, email from public."user" where id = $1 and deleted_at is null`,
  [actorId]
)
const tenantRow = await db.query(
  `select slug, database_schema, database_status, medusa_user_id from public.skrepayshop_tenants where slug = $1`,
  [tenantSlug || "luigi-games"]
)

await db.end()

const meRes = await fetch(`${base}/admin/users/me`, {
  headers: { Authorization: `Bearer ${token}` },
})
const meBody = meRes.ok ? "ok" : (await meRes.text()).slice(0, 120)

const storesRes = await fetch(`${base}/admin/stores`, {
  headers: { Authorization: `Bearer ${token}` },
})
const stores = storesRes.ok ? await storesRes.json() : null

console.log(
  JSON.stringify(
    {
      actor_id: actorId,
      tenant_slug: tenantSlug,
      user_in_tenant_schema: Boolean(inTenant.rows[0]),
      user_in_public_schema: Boolean(inPublic.rows[0]),
      tenant_record: tenantRow.rows[0],
      users_me_status: meRes.status,
      users_me_hint: meBody,
      stores_status: storesRes.status,
      store_names: stores?.stores?.map((s) => s.name) ?? [],
    },
    null,
    2
  )
)
