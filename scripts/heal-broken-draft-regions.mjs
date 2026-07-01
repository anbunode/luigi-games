import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../skrepayshop-api/apps/backend")
const pg = createRequire(resolve(backendRoot, "package.json"))("pg")

function loadEnv(n) {
  const r = readFileSync(resolve(backendRoot, ".env"), "utf8")
  for (const l of r.split(/\r?\n/)) {
    if (l.startsWith(n + "=")) return l.slice(n.length + 1).trim().replace(/^["']|["']$/g, "")
  }
  return ""
}

const client = new pg.Client({ connectionString: loadEnv("DATABASE_URL"), ssl: { rejectUnauthorized: false } })
await client.connect()

const regions = await client.query(
  `select id, name from public.region where deleted_at is null`
)
const regionIds = new Set(regions.rows.map((r) => r.id))
console.log("valid regions:", regions.rows)

const broken = await client.query(
  `select id, display_id, email, region_id, sales_channel_id, created_at
   from public."order"
   where status = 'draft' and deleted_at is null
   order by created_at desc`
)

const bad = broken.rows.filter((d) => !d.region_id || !regionIds.has(d.region_id))
console.log("\nbroken drafts:", bad.length)
for (const d of bad) console.log(d)

const defaultRegion = regions.rows[0]?.id
if (defaultRegion && bad.length) {
  const r = await client.query(
    `update public."order"
     set region_id = $1, updated_at = now()
     where status = 'draft' and deleted_at is null
       and (region_id is null or region_id not in (select id from public.region where deleted_at is null))`,
    [defaultRegion]
  )
  console.log("\nfixed region_id on", r.rowCount, "drafts ->", defaultRegion)
}

await client.end()
