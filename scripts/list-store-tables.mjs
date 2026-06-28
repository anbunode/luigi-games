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

const c = new pg.Client({ connectionString: loadEnv("DATABASE_URL"), ssl: { rejectUnauthorized: false } })
await c.connect()

const tables = await c.query(`
  select table_name from information_schema.tables
  where table_schema='public' and table_name like '%region%' or table_name like '%store%'
  order by 1
`)
console.log(tables.rows.map(r => r.table_name).filter(n => !n.startsWith('skrepayshop')))

await c.end()
