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

for (const table of ["tax_region", "tax_rate", "region", "region_country"]) {
  const cols = await client.query(
    `select column_name from information_schema.columns
     where table_schema = 't_luigi_game' and table_name = $1
     order by ordinal_position`,
    [table]
  )
  console.log(table, cols.rows.map((r) => r.column_name).join(", "))
}

const taxRegions = await client.query(
  `select * from "t_luigi_game".tax_region where deleted_at is null limit 5`
)
console.log("tax_region rows", taxRegions.rows.length, taxRegions.rows)

const regions = await client.query(
  `select id, name, currency_code, automatic_taxes from "t_luigi_game".region where deleted_at is null`
)
console.log("regions", regions.rows)

await client.end()
