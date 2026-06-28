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

const providers = await client.query(
  `select id, is_enabled from "t_luigi_game".tax_provider where deleted_at is null`
)
console.log("tax_provider", providers.rows)

const countries = await client.query(
  `select rc.iso_2, rc.display_name, r.name as region_name
   from "t_luigi_game".region_country rc
   join "t_luigi_game".region r on r.id = rc.region_id
   where rc.deleted_at is null and r.deleted_at is null`
)
console.log("region countries", countries.rows)

await client.end()
