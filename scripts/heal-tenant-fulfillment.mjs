/**
 * Repara ubicaciones y envío para tenants:
 * - Elimina enlaces rotos sales_channel → stock_location en public
 * - Copia shipping_profile por defecto al tenant si falta
 * - Crea ubicación de stock enlazada al canal de ventas del tenant
 *
 * Uso:
 *   node scripts/heal-tenant-fulfillment.mjs
 *   node scripts/heal-tenant-fulfillment.mjs luigi-game
 */
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"
import { randomBytes } from "crypto"

const slugArg = process.argv[2]
const backendRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../skrepayshop-api/apps/backend"
)
const pg = createRequire(resolve(backendRoot, "package.json"))("pg")

function makeEntityId(prefix) {
  return `${prefix}_${randomBytes(16).toString("hex").slice(0, 26).toUpperCase()}`
}

function loadEnv(name) {
  if (process.env[name]) return process.env[name].trim()
  const raw = readFileSync(resolve(backendRoot, ".env"), "utf8")
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith(`${name}=`)) {
      return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "")
    }
  }
  return ""
}

function quoteIdent(value) {
  return `"${value.replace(/"/g, '""')}"`
}

const url = loadEnv("DATABASE_URL")
const client = new pg.Client({
  connectionString: url,
  ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false },
})

await client.connect()

const brokenLinks = await client.query(
  `delete from public.sales_channel_stock_location scl
   where not exists (
     select 1 from public.sales_channel sc
     where sc.id = scl.sales_channel_id and sc.deleted_at is null
   )
   returning id, stock_location_id, sales_channel_id`
)
console.log("public broken links removed:", brokenLinks.rowCount)

const tenants = slugArg
  ? await client.query(
      `select slug, database_schema, display_name
       from public.skrepayshop_tenants
       where slug = $1`,
      [slugArg]
    )
  : await client.query(
      `select slug, database_schema, display_name
       from public.skrepayshop_tenants
       where database_schema is not null and database_status = 'active'
       order by created_at asc`
    )

for (const tenant of tenants.rows) {
  const schema =
    tenant.database_schema || `t_${tenant.slug.replace(/[^a-z0-9_]/g, "_")}`
  const schemaQ = quoteIdent(schema)

  console.log(`\n${tenant.slug} → ${schema}`)

  const locationCount = await client.query(
    `select count(*)::int as c from ${schemaQ}.stock_location where deleted_at is null`
  )

  if (locationCount.rows[0].c > 0) {
    console.log("  stock locations already exist, skipping seed")
    continue
  }

  const store = await client.query(
    `select id, name, default_sales_channel_id
     from ${schemaQ}.store
     where deleted_at is null
     order by created_at asc
     limit 1`
  )
  const storeRow = store.rows[0]

  if (!storeRow) {
    console.log("  no store row, skipping")
    continue
  }

  const profileExists = await client.query(
    `select count(*)::int as c from ${schemaQ}.shipping_profile where deleted_at is null`
  )

  if (profileExists.rows[0].c === 0) {
    await client.query(
      `insert into ${schemaQ}.shipping_profile
       select * from public.shipping_profile
       where deleted_at is null
       limit 1`
    )
    console.log("  copied default shipping_profile from public")
  }

  const locationId = makeEntityId("sloc")
  const addressId = makeEntityId("laddr")
  const locationName = storeRow.name?.trim() || tenant.display_name || "Tienda"

  await client.query("begin")

  try {
    await client.query(
      `insert into ${schemaQ}.stock_location_address (
         id, address_1, country_code, created_at, updated_at
       ) values ($1, '', 'us', now(), now())`,
      [addressId]
    )

    await client.query(
      `insert into ${schemaQ}.stock_location (
         id, name, address_id, created_at, updated_at
       ) values ($1, $2, $3, now(), now())`,
      [locationId, locationName, addressId]
    )

    if (storeRow.default_sales_channel_id) {
      const linkId = makeEntityId("scloc")
      await client.query(
        `insert into ${schemaQ}.sales_channel_stock_location (
           id, sales_channel_id, stock_location_id, created_at, updated_at
         ) values ($1, $2, $3, now(), now())`,
        [linkId, storeRow.default_sales_channel_id, locationId]
      )
    }

    await client.query(
      `update ${schemaQ}.store
       set default_location_id = $2, updated_at = now()
       where id = $1`,
      [storeRow.id, locationId]
    )

    await client.query("commit")
    console.log(`  created stock location ${locationId} (${locationName})`)
  } catch (error) {
    await client.query("rollback")
    console.error(
      "  ERROR:",
      error instanceof Error ? error.message : String(error)
    )
  }
}

await client.end()
console.log("\nDone.")
