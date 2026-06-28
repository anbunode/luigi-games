import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"

const confirmed = process.argv.includes("--confirm")
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

const before = await client.query(
  `select count(*)::int active, count(*) filter (where deleted_at is not null)::int deleted
   from public.region_country where region_id is null`
)
console.log("public unassigned antes", before.rows[0])

if (!confirmed) {
  console.log("dry run — usa --confirm")
  await client.end()
  process.exit(0)
}

const result = await client.query(
  `update public.region_country
   set deleted_at = null, updated_at = now()
   where region_id is null and deleted_at is not null`
)
console.log("restored rows", result.rowCount)

const after = await client.query(
  `select count(*)::int active from public.region_country where region_id is null and deleted_at is null`
)
console.log("public unassigned activos", after.rows[0])

await client.end()
