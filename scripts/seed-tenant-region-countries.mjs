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

async function audit(label) {
  const unassigned = await client.query(
    `select count(*)::int c from ${schemaQ}.region_country where region_id is null`
  )
  const missing = await client.query(
    `select count(*)::int c
     from (
       select distinct lower(iso_2) as iso_2 from public.region_country
     ) pub
     where not exists (
       select 1 from ${schemaQ}.region_country t where lower(t.iso_2) = pub.iso_2
     )`
  )
  const orphaned = await client.query(
    `select count(*)::int c
     from ${schemaQ}.region_country rc
     inner join ${schemaQ}.region r on r.id = rc.region_id and r.deleted_at is not null`
  )
  console.log(label, {
    unassigned: unassigned.rows[0].c,
    missing_vs_public: missing.rows[0].c,
    orphaned_on_deleted_regions: orphaned.rows[0].c,
  })
}

await audit("antes")

if (!confirmed) {
  console.log("dry run — usa --confirm")
  await client.end()
  process.exit(0)
}

await client.query("begin")
try {
  const released = await client.query(
    `update ${schemaQ}.region_country rc
     set region_id = null, updated_at = now()
     from ${schemaQ}.region r
     where rc.region_id = r.id and r.deleted_at is not null`
  )

  const inserted = await client.query(
    `insert into ${schemaQ}.region_country
       (iso_2, iso_3, num_code, name, display_name, region_id, created_at, updated_at)
     select catalog.iso_2, catalog.iso_3, catalog.num_code, catalog.name, catalog.display_name, null, now(), now()
     from (
       select distinct on (lower(iso_2))
         iso_2, iso_3, num_code, name, display_name
       from public.region_country
       order by lower(iso_2), region_id nulls first
     ) catalog
     where not exists (
       select 1 from ${schemaQ}.region_country t where lower(t.iso_2) = lower(catalog.iso_2)
     )`
  )

  await client.query("commit")
  console.log("released", released.rowCount, "inserted", inserted.rowCount)
} catch (e) {
  await client.query("rollback")
  throw e
}

await audit("despues")

for (const code of ["fr", "de", "es"]) {
  const r = await client.query(
    `select iso_2, region_id from ${schemaQ}.region_country where lower(iso_2) = $1`,
    [code]
  )
  console.log(code, r.rows[0] ?? "MISSING")
}

await client.end()
