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

const tables = await client.query(
  `select table_name from information_schema.tables
   where table_schema = $1 and table_name like '%countr%'
   order by table_name`,
  [schema]
)
console.log("country tables", tables.rows.map((r) => r.table_name))

for (const table of tables.rows) {
  const t = table.table_name
  const count = await client.query(`select count(*)::int c from ${s}."${t}"`)
  console.log(t, count.rows[0].c)
}

const af = await client.query(
  `select * from ${s}.region_country where lower(iso_2) = 'af' limit 1`
).catch(() => ({ rows: [] }))
console.log("region_country af", af.rows)

await client.end()
