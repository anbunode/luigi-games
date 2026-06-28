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

for (const schema of ["public", "t_luigi_games"]) {
  const store = await c.query(`select id, name, default_sales_channel_id from "${schema}".store limit 3`)
  const users = await c.query(`select id, email from "${schema}"."user" where deleted_at is null limit 3`)
  const regions = await c.query(`select id, name from "${schema}".region where deleted_at is null limit 3`)
  console.log(schema, { stores: store.rows, users: users.rows, regions: regions.rows })
}

await c.end()
