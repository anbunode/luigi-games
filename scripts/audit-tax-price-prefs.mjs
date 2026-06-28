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

for (const schema of ["t_luigi_game", "public"]) {
  for (const table of ["price_preference", "tax_rate", "tax_region"]) {
    const exists = await client.query(
      `select 1 from information_schema.tables where table_schema = $1 and table_name = $2`,
      [schema, table]
    )
    if (!exists.rowCount) continue
    const active = await client.query(
      `select count(*)::int c from "${schema}"."${table}" where deleted_at is null`
    )
    const all = await client.query(`select count(*)::int c from "${schema}"."${table}"`)
    console.log(`${schema}.${table}: active=${active.rows[0].c} total=${all.rows[0].c}`)
  }
}

const prefs = await client.query(
  `select attribute, value, is_tax_inclusive from public.price_preference where deleted_at is null limit 20`
)
console.log("public price_preference sample", prefs.rows)

const tprefs = await client.query(
  `select attribute, value, is_tax_inclusive from "t_luigi_game".price_preference where deleted_at is null limit 20`
)
console.log("tenant price_preference sample", tprefs.rows)

await client.end()
