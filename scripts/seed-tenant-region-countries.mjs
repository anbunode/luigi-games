import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"

const slug = process.argv[2] || "luigi-game"
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

const tenant = await client.query(
  `select database_schema from public.skrepayshop_tenants where slug = $1`,
  [slug]
)
const schema = tenant.rows[0]?.database_schema
if (!schema) {
  console.error("tenant not found")
  process.exit(1)
}

const schemaQ = `"${schema}"`

const before = await client.query(
  `select count(*)::int total,
          count(*) filter (where region_id is null)::int unassigned
   from ${schemaQ}.region_country`
)
console.log("antes", before.rows[0])

const publicPool = await client.query(
  `select count(*)::int c from public.region_country where region_id is null`
)
console.log("public pool", publicPool.rows[0].c)

if (!confirmed) {
  console.log("dry run — usa --confirm")
  await client.end()
  process.exit(0)
}

await client.query("begin")
try {
  await client.query(
    `insert into ${schemaQ}.region_country
       (iso_2, iso_3, num_code, name, display_name, region_id, created_at, updated_at, deleted_at)
     select iso_2, iso_3, num_code, name, display_name, null, now(), now(), null
     from public.region_country
     where region_id is null
     on conflict (iso_2) do update
       set iso_3 = excluded.iso_3,
           num_code = excluded.num_code,
           name = excluded.name,
           display_name = excluded.display_name,
           deleted_at = null,
           updated_at = now()
     where ${schemaQ}.region_country.region_id is null`
  )

  await client.query("commit")

  const after = await client.query(
    `select count(*)::int total,
            count(*) filter (where region_id is null)::int unassigned
     from ${schemaQ}.region_country`
  )
  console.log("despues", after.rows[0])
} catch (e) {
  await client.query("rollback")
  throw e
}

await client.end()
