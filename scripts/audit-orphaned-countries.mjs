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

const orphaned = await client.query(
  `select rc.iso_2, rc.region_id, r.name, r.deleted_at
   from ${s}.region_country rc
   inner join ${s}.region r on r.id = rc.region_id
   where r.deleted_at is not null
   order by rc.iso_2`
)
console.log("orphaned (assigned to deleted regions):", orphaned.rows)

for (const code of ["fr", "de", "es", "gb", "it"]) {
  const r = await client.query(
    `select iso_2, region_id from ${s}.region_country where lower(iso_2) = $1`,
    [code]
  )
  console.log(code, r.rows[0] ?? "MISSING")
}

await client.end()
