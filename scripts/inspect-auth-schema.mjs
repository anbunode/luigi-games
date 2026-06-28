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
const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await c.connect()

for (const table of ["auth_identity", "provider_identity", "user"]) {
  const cols = await c.query(
    `select column_name, data_type, is_nullable
     from information_schema.columns
     where table_schema='public' and table_name=$1
     order by ordinal_position`,
    [table]
  )
  console.log(`\n=== ${table} ===`)
  console.log(cols.rows.map((r) => `${r.column_name} ${r.data_type} ${r.is_nullable}`).join("\n"))
}

const sample = await c.query(
  `select pi.provider, pi.entity_id, pi.provider_metadata, ai.app_metadata
   from public.provider_identity pi
   join public.auth_identity ai on ai.id = pi.auth_identity_id
   limit 1`
)
console.log("\n=== sample provider ===")
console.log(JSON.stringify(sample.rows[0], null, 2))

await c.end()
