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

for (const s of ["public", schema]) {
  const q = `"${s}"`
  const total = await client.query(`select count(*)::int c from ${q}.region_country`)
  const unassigned = await client.query(
    `select count(*)::int c from ${q}.region_country where region_id is null`
  )
  const sample = await client.query(
    `select iso_2, region_id from ${q}.region_country order by iso_2 limit 5`
  )
  console.log(s, { total: total.rows[0].c, unassigned: unassigned.rows[0].c, sample: sample.rows })
}

await client.end()
