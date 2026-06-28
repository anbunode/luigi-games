import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"

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
const client = new pg.Client({
  connectionString: url,
  ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false },
})
await client.connect()

const stores = await client.query(`select id from public.store where deleted_at is null`)
console.log("public stores", stores.rows.length, stores.rows.map((r) => r.id))

const byStore = await client.query(
  `select store_id, count(*)::int c from public.store_currency where deleted_at is null group by store_id`
)
console.log("active by store", byStore.rows)

await client.end()
