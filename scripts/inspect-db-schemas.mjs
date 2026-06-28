import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../skrepayshop-api/apps/backend")
const pg = createRequire(resolve(backendRoot, "package.json"))("pg")

function loadEnvValue(name) {
  const raw = readFileSync(resolve(backendRoot, ".env"), "utf8")
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith(`${name}=`)) return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "")
  }
  return ""
}

const url = loadEnvValue("DATABASE_URL")
const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await c.connect()

const schemas = await c.query(`select schema_name from information_schema.schemata where schema_name like 't_%' order by 1`)
console.log("tenant schemas:", schemas.rows)

const tCount = await c.query(`select count(*)::int c from information_schema.tables where table_schema = 't_luigi_games'`)
console.log("tables in t_luigi_games:", tCount.rows[0].c)

const pubCount = await c.query(`select count(*)::int c from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE'`)
console.log("tables in public:", pubCount.rows[0].c)

const tenant = await c.query(`select slug, database_schema, database_status, owner_email, medusa_user_id from skrepayshop_tenants where slug='luigi-games'`)
console.log("tenant row:", tenant.rows[0])

const migPublic = await c.query(`select table_name from information_schema.tables where table_schema='public' and table_name like '%migration%'`)
const migTenant = await c.query(`select table_name from information_schema.tables where table_schema='t_luigi_games'`)
console.log("migration tables public:", migPublic.rows)
console.log("tables in t_luigi_games:", migTenant.rows.slice(0, 10), "count", migTenant.rows.length)

await c.end()
