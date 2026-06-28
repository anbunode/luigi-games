/**
 * Restaura configuración de tienda y borra regiones + impuestos del tenant.
 *
 * Uso:
 *   node scripts/reset-tenant-store-and-regions.mjs
 *   node scripts/reset-tenant-store-and-regions.mjs luigi-game
 *   node scripts/reset-tenant-store-and-regions.mjs luigi-game --confirm
 */
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"
import { randomBytes } from "crypto"

const slugArg = process.argv[2] || "luigi-game"
const confirmed = process.argv.includes("--confirm")
const defaultCurrency = (process.env.DEFAULT_STORE_CURRENCY || "usd").toLowerCase()

const backendRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../skrepayshop-api/apps/backend"
)
const pg = createRequire(resolve(backendRoot, "package.json"))("pg")

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

function newId(prefix) {
  return `${prefix}_${randomBytes(12).toString("hex").slice(0, 26).toUpperCase()}`
}

function qTable(schema, table) {
  return `${quoteIdent(schema)}.${quoteIdent(table)}`
}

async function tableExists(client, schema, table) {
  const result = await client.query(
    `select 1 from information_schema.tables
     where table_schema = $1 and table_name = $2`,
    [schema, table]
  )
  return result.rowCount > 0
}

async function countActive(client, schema, table) {
  if (!(await tableExists(client, schema, table))) {
    return 0
  }

  const hasDeleted = await client.query(
    `select 1 from information_schema.columns
     where table_schema = $1 and table_name = $2 and column_name = 'deleted_at'`,
    [schema, table]
  )
  const where = hasDeleted.rowCount > 0 ? "where deleted_at is null" : ""
  const result = await client.query(
    `select count(*)::int as c from ${qTable(schema, table)} ${where}`
  )
  return result.rows[0]?.c ?? 0
}

async function softDeleteAll(client, schema, table) {
  if (!(await tableExists(client, schema, table))) {
    return 0
  }

  const hasDeleted = await client.query(
    `select 1 from information_schema.columns
     where table_schema = $1 and table_name = $2 and column_name = 'deleted_at'`,
    [schema, table]
  )

  if (hasDeleted.rowCount === 0) {
    const result = await client.query(`delete from ${qTable(schema, table)}`)
    return result.rowCount ?? 0
  }

  const result = await client.query(
    `update ${qTable(schema, table)}
     set deleted_at = now(), updated_at = now()
     where deleted_at is null`
  )
  return result.rowCount ?? 0
}

async function resetStoreCurrencies(client, schema, storeId) {
  const table = qTable(schema, "store_currency")
  const removed = await client.query(
    `update ${table}
     set deleted_at = now(), updated_at = now()
     where store_id = $1 and deleted_at is null
       and lower(currency_code) <> $2
     returning id`,
    [storeId, defaultCurrency]
  )

  const existing = await client.query(
    `select id from ${table}
     where store_id = $1 and lower(currency_code) = $2
     order by deleted_at nulls first
     limit 1`,
    [storeId, defaultCurrency]
  )

  if (existing.rows[0]?.id) {
    await client.query(
      `update ${table}
       set is_default = true, deleted_at = null, updated_at = now()
       where id = $1`,
      [existing.rows[0].id]
    )
  } else {
    await client.query(
      `insert into ${table}
         (id, currency_code, store_id, is_default, created_at, updated_at)
       values ($1, $2, $3, true, now(), now())`,
      [newId("stocur"), defaultCurrency, storeId]
    )
  }

  await client.query(
    `update ${table}
     set is_default = false, updated_at = now()
     where store_id = $1 and deleted_at is null and lower(currency_code) <> $2`,
    [storeId, defaultCurrency]
  )

  return removed.rowCount ?? 0
}

async function softDeleteAllInSchema(client, schema, table) {
  return softDeleteAll(client, schema, table)
}

async function purgePublicCommerceLeaks(client) {
  const report = {
    public_regions: 0,
    public_region_countries: 0,
    public_region_payment_providers: 0,
    public_tax_regions: 0,
    public_tax_rates: 0,
    public_price_preferences: 0,
    public_store_currencies: 0,
  }

  report.public_tax_rates = await softDeleteAllInSchema(client, "public", "tax_rate")
  report.public_tax_regions = await softDeleteAllInSchema(client, "public", "tax_region")
  report.public_region_payment_providers = await softDeleteAllInSchema(
    client,
    "public",
    "region_payment_provider"
  )
  // No borrar el catálogo global de países (region_id null) — necesario para crear regiones
  report.public_region_countries = (
    await client.query(
      `update public.region_country
       set deleted_at = now(), updated_at = now()
       where region_id is not null and deleted_at is null
       returning iso_2`
    )
  ).rowCount ?? 0
  report.public_regions = await softDeleteAllInSchema(client, "public", "region")
  report.public_price_preferences = await softDeleteAllInSchema(
    client,
    "public",
    "price_preference"
  )

  if (await tableExists(client, "public", "store_currency")) {
    const stores = await client.query(
      `select id from public.store where deleted_at is null`
    )
    for (const store of stores.rows) {
      const removed = await client.query(
        `update public.store_currency
         set deleted_at = now(), updated_at = now()
         where store_id = $1 and deleted_at is null
           and lower(currency_code) <> $2
         returning id`,
        [store.id, defaultCurrency]
      )
      report.public_store_currencies += removed.rowCount ?? 0

      const existing = await client.query(
        `select id from public.store_currency
         where store_id = $1 and lower(currency_code) = $2
         order by deleted_at nulls first limit 1`,
        [store.id, defaultCurrency]
      )
      if (existing.rows[0]?.id) {
        await client.query(
          `update public.store_currency
           set is_default = true, deleted_at = null, updated_at = now()
           where id = $1`,
          [existing.rows[0].id]
        )
      }
    }
  }

  if (await tableExists(client, "public", "store")) {
    await client.query(
      `update public.store
       set default_region_id = null,
           default_location_id = null,
           metadata = null,
           updated_at = now()
       where deleted_at is null`
    )
  }

  return report
}

async function resetTenant(client, schema, tenantSlug) {
  const report = {
    slug: tenantSlug,
    schema,
    regions: 0,
    tax_rates: 0,
    tax_regions: 0,
    region_countries: 0,
    region_payment_providers: 0,
    public_regions: 0,
    public_region_countries: 0,
    public_region_payment_providers: 0,
    public_tax_regions: 0,
    public_tax_rates: 0,
    public_price_preferences: 0,
    public_store_currencies: 0,
    currencies_removed: 0,
    price_preferences: 0,
    store_id: null,
  }

  await client.query("begin")

  try {
    report.regions = await softDeleteAll(client, schema, "region")
    report.tax_rates = await softDeleteAll(client, schema, "tax_rate")
    report.tax_regions = await softDeleteAll(client, schema, "tax_region")
    report.region_countries = await softDeleteAll(client, schema, "region_country")
    report.region_payment_providers = await softDeleteAll(
      client,
      schema,
      "region_payment_provider"
    )

    if (await tableExists(client, schema, "country")) {
      await client.query(
        `update ${qTable(schema, "country")}
         set region_id = null, updated_at = now()
         where region_id is not null`
      )
    }

    if (await tableExists(client, schema, "price_preference")) {
      const prefs = await client.query(
        `update ${qTable(schema, "price_preference")}
         set deleted_at = now(), updated_at = now()
         where deleted_at is null
         returning id`
      )
      report.price_preferences = prefs.rowCount ?? 0
    }

    const store = await client.query(
      `select id, name from ${qTable(schema, "store")} where deleted_at is null limit 1`
    )
    const storeId = store.rows[0]?.id
    report.store_id = storeId

    if (storeId) {
      report.currencies_removed = await resetStoreCurrencies(
        client,
        schema,
        storeId
      )

      await client.query(
        `update ${qTable(schema, "store")}
         set default_region_id = null,
             default_location_id = null,
             metadata = null,
             updated_at = now()
         where id = $1 and deleted_at is null`,
        [storeId]
      )
    }

    const publicReport = await purgePublicCommerceLeaks(client)
    Object.assign(report, publicReport)

    if (await tableExists(client, schema, "region_country")) {
      await client.query(
        `insert into ${qTable(schema, "region_country")}
           (iso_2, iso_3, num_code, name, display_name, region_id, created_at, updated_at, deleted_at)
         select iso_2, iso_3, num_code, name, display_name, null, now(), now(), null
         from public.region_country
         where region_id is null and deleted_at is null
         on conflict (iso_2) do update
           set iso_3 = excluded.iso_3,
               num_code = excluded.num_code,
               name = excluded.name,
               display_name = excluded.display_name,
               deleted_at = null,
               updated_at = now()
         where ${qTable(schema, "region_country")}.region_id is null`
      )
    }

    await client.query("commit")
  } catch (error) {
    await client.query("rollback")
    throw error
  }

  return report
}

const url = loadEnv("DATABASE_URL")
if (!url) {
  console.error("DATABASE_URL no configurada")
  process.exit(1)
}

const client = new pg.Client({
  connectionString: url,
  ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false },
})
await client.connect()

const tenants = await client.query(
  `select slug, database_schema
   from public.skrepayshop_tenants
   where slug = $1 and database_schema is not null`,
  [slugArg]
)

if (tenants.rows.length === 0) {
  console.error(`Tenant no encontrado: ${slugArg}`)
  process.exit(1)
}

for (const tenant of tenants.rows) {
  const before = {
    regions: await countActive(client, tenant.database_schema, "region"),
    tax_regions: await countActive(client, tenant.database_schema, "tax_region"),
    currencies: await client.query(
      `select count(*)::int as c from ${qTable(tenant.database_schema, "store_currency")}
       where deleted_at is null`
    ),
  }

  console.log(`\n${tenant.slug} (${tenant.database_schema})`)
  console.log("  antes:", {
    regions: before.regions,
    tax_regions: before.tax_regions,
    currencies: before.currencies.rows[0]?.c,
  })

  if (!confirmed) {
    console.log(
      "  DRY RUN — ejecuta con --confirm para aplicar cambios"
    )
    continue
  }

  const report = await resetTenant(
    client,
    tenant.database_schema,
    tenant.slug
  )
  console.log("  restaurado:", report)
}

await client.end()
console.log(confirmed ? "\nListo." : "\nSin cambios (dry run).")
