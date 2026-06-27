/**
 * Siembra store + region mínimos en schema tenant (fix panel en blanco).
 */
import { readFileSync } from "fs"
import { randomBytes } from "crypto"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"

const slug = process.argv[2] || "luigi-games"
const schema = `t_${slug.replace(/[^a-z0-9_]/g, "_")}`
const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../skrepayshop-api/apps/backend")
const pg = createRequire(resolve(backendRoot, "package.json"))("pg")

function loadEnv(name) {
  const raw = readFileSync(resolve(backendRoot, ".env"), "utf8")
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith(`${name}=`)) return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "")
  }
  return ""
}

function newId(prefix) {
  return `${prefix}_01${randomBytes(12).toString("hex").slice(0, 24).toUpperCase()}`
}

const url = loadEnv("DATABASE_URL")
const client = new pg.Client({
  connectionString: url,
  ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false },
})

await client.connect()

const tenant = await client.query(
  `select display_name, medusa_sales_channel_id from skrepayshop_tenants where slug=$1`,
  [slug]
)
const shopName = tenant.rows[0]?.display_name || "Luigi Games"
const salesChannelId = tenant.rows[0]?.medusa_sales_channel_id

if (!salesChannelId) {
  throw new Error("Tenant sin sales channel")
}

const existing = await client.query(
  `select id from "${schema}".store where deleted_at is null limit 1`
)

if (existing.rows[0]) {
  console.log("Store ya existe en", schema)
} else {
  const storeId = newId("store")
  const regionId = newId("reg")
  await client.query("begin")
  await client.query(
    `insert into "${schema}".region (id, name, currency_code, automatic_taxes, created_at, updated_at)
     values ($1, 'Europe', 'eur', false, now(), now())`,
    [regionId]
  )
  await client.query(
    `insert into "${schema}".store (id, name, default_sales_channel_id, default_region_id, created_at, updated_at)
     values ($1, $2, $3, $4, now(), now())`,
    [storeId, shopName, salesChannelId, regionId]
  )
  await client.query("commit")
  console.log(JSON.stringify({ storeId, regionId, salesChannelId }, null, 2))
}

await client.end()
