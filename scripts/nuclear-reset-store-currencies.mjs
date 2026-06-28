/**
 * Reset total monedas tienda: tenant + public → solo USD activo.
 * Borra filas soft-deleted para evitar confusión.
 */
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"
import { randomBytes } from "crypto"

const slug = process.argv[2] || "luigi-game"
const confirmed = process.argv.includes("--confirm")
const defaultCurrency = "usd"

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../skrepayshop-api/apps/backend")
const pg = createRequire(resolve(backendRoot, "package.json"))("pg")

function loadEnv(name) {
  const raw = readFileSync(resolve(backendRoot, ".env"), "utf8")
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith(`${name}=`)) return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "")
  }
  return ""
}

function newId(prefix) {
  return `${prefix}_${randomBytes(12).toString("hex").slice(0, 26).toUpperCase()}`
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

const q = (s, table) => `"${s}"."${table}"`

async function resetSchemaStoreCurrencies(schemaName) {
  const stores = await client.query(
    `select id from ${q(schemaName, "store")} where deleted_at is null`
  )

  if (!stores.rows.length) {
    return { stores: 0, active: 0 }
  }

  let totalActive = 0

  for (const { id: storeId } of stores.rows) {
    await client.query(`delete from ${q(schemaName, "store_currency")} where store_id = $1`, [storeId])

    await client.query(
      `insert into ${q(schemaName, "store_currency")}
         (id, currency_code, store_id, is_default, created_at, updated_at)
       values ($1, $2, $3, true, now(), now())`,
      [newId("stocur"), defaultCurrency, storeId]
    )

    await client.query(
      `update ${q(schemaName, "store")}
       set default_region_id = null, default_location_id = null, metadata = null, updated_at = now()
       where id = $1`,
      [storeId]
    )

    const active = await client.query(
      `select count(*)::int c from ${q(schemaName, "store_currency")} where deleted_at is null and store_id = $1`,
      [storeId]
    )
    totalActive += active.rows[0].c
  }

  if (await tableExists(schemaName, "price_preference")) {
    await client.query(`delete from ${q(schemaName, "price_preference")}`)
    await client.query(
      `insert into ${q(schemaName, "price_preference")}
         (id, attribute, value, is_tax_inclusive, created_at, updated_at)
       values ($1, 'currency_code', $2, false, now(), now())`,
      [newId("ppref"), defaultCurrency]
    )
  }

  return { stores: stores.rows.length, active: totalActive }
}

async function tableExists(schemaName, table) {
  const r = await client.query(
    `select 1 from information_schema.tables where table_schema = $1 and table_name = $2`,
    [schemaName, table]
  )
  return r.rowCount > 0
}

const before = {
  tenant: await client.query(
    `select count(*)::int c from ${q(schema, "store_currency")} where deleted_at is null`
  ),
  public: await client.query(
    `select count(*)::int c from public.store_currency where deleted_at is null`
  ),
}
console.log("antes:", { tenant: before.tenant.rows[0].c, public: before.public.rows[0].c })

if (!confirmed) {
  console.log("dry run — usa --confirm")
  await client.end()
  process.exit(0)
}

await client.query("begin")
try {
  const tenantResult = await resetSchemaStoreCurrencies(schema)
  const publicResult = await resetSchemaStoreCurrencies("public")

  for (const table of ["tax_rate", "tax_region", "region_payment_provider", "region"]) {
    if (await tableExists(schema, table)) {
      await client.query(
        `update ${q(schema, table)} set deleted_at = now(), updated_at = now() where deleted_at is null`
      )
    }
    if (await tableExists("public", table)) {
      await client.query(
        `update public."${table}" set deleted_at = now(), updated_at = now() where deleted_at is null`
      )
    }
  }

  // Solo países asignados a regiones — nunca borrar el catálogo global (region_id is null)
  for (const schemaName of [schema, "public"]) {
    if (await tableExists(schemaName, "region_country")) {
      await client.query(
        `update ${q(schemaName, "region_country")}
         set deleted_at = now(), updated_at = now()
         where region_id is not null and deleted_at is null`
      )
    }
  }

  // Re-sembrar pool tenant si quedó vacío
  if (schema !== "public") {
    await client.query(
      `insert into ${q(schema, "region_country")}
         (iso_2, iso_3, num_code, name, display_name, region_id, created_at, updated_at, deleted_at)
       select iso_2, iso_3, num_code, name, display_name, null, now(), now(), null
       from public.region_country
       where region_id is null and deleted_at is null
       on conflict (iso_2) do update
         set deleted_at = null, updated_at = now()
       where ${q(schema, "region_country")}.region_id is null`
    )
  }

  await client.query("commit")
  console.log("restaurado:", { tenant: tenantResult, public: publicResult })
} catch (e) {
  await client.query("rollback")
  throw e
}

await client.end()
