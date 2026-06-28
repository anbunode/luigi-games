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

for (const code of ["af", "al"]) {
  const row = await client.query(
    `select iso_2, region_id, deleted_at from ${s}.region_country where lower(iso_2) = $1`,
    [code]
  )
  console.log(code, row.rows[0] ?? "MISSING")
}

const cols = await client.query(
  `select column_name, data_type from information_schema.columns
   where table_schema = $1 and table_name = 'region_country' order by ordinal_position`,
  [schema]
)
console.log("columns", cols.rows)

await client.end()
