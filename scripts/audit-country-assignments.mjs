import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"

const slug = process.argv[2] || "luigi-game"
const codes = (process.argv[3] || "fr,de,es,al,at,au").split(",").map((c) => c.trim().toLowerCase())

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

const tenant = await client.query(
  `select database_schema from public.skrepayshop_tenants where slug = $1`,
  [slug]
)
const schema = tenant.rows[0]?.database_schema
const s = `"${schema}"`

console.log("schema", schema)

const regions = await client.query(
  `select id, name, deleted_at from ${s}.region order by created_at`
)
console.log("\nregions:", regions.rows)

const rows = await client.query(
  `select rc.iso_2, rc.display_name, rc.region_id, r.name as region_name, r.deleted_at as region_deleted
   from ${s}.region_country rc
   left join ${s}.region r on r.id = rc.region_id
   where lower(rc.iso_2) = any($1::text[])
   order by rc.iso_2`,
  [codes]
)
console.log("\ncountry assignment:", rows.rows)

const assignedNotDeleted = await client.query(
  `select rc.iso_2, rc.region_id, r.name, r.deleted_at
   from ${s}.region_country rc
   inner join ${s}.region r on r.id = rc.region_id and r.deleted_at is null
   where lower(rc.iso_2) = any($1::text[])`,
  [codes]
)
console.log("\nassigned to ACTIVE regions:", assignedNotDeleted.rows)

await client.end()
