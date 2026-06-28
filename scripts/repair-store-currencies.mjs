/**
 * Deja solo las monedas habilitadas por el usuario en store_currency.
 * Por defecto conserva la moneda base (is_default) o USD.
 *
 * Uso:
 *   node scripts/repair-store-currencies.mjs
 *   node scripts/repair-store-currencies.mjs luigi-game
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
  const hex = randomBytes(12).toString("hex")
  return `${prefix}_${hex.slice(0, 26).toUpperCase()}`
}

async function resetStoreEnabledCurrencies(client, schema, fallbackDefault = "usd") {
  const schemaQ = quoteIdent(schema)
  const stores = await client.query(
    `select id from ${schemaQ}.store where deleted_at is null`
  )

  if (stores.rows.length === 0) {
    return { stores: 0, enabled: 0, removed: 0 }
  }

  let removed = 0

  for (const store of stores.rows) {
    const defaultRow = await client.query(
      `select currency_code from ${schemaQ}.store_currency
       where store_id = $1 and deleted_at is null and is_default = true
       limit 1`,
      [store.id]
    )

    const defaultCode = (
      defaultRow.rows[0]?.currency_code ?? fallbackDefault
    ).toLowerCase()

    const removedResult = await client.query(
      `update ${schemaQ}.store_currency
       set deleted_at = now(), updated_at = now()
       where store_id = $1 and deleted_at is null and lower(currency_code) <> $2
       returning id`,
      [store.id, defaultCode]
    )
    removed += removedResult.rowCount ?? 0

    const existing = await client.query(
      `select id from ${schemaQ}.store_currency
       where store_id = $1 and lower(currency_code) = $2
       order by deleted_at nulls first
       limit 1`,
      [store.id, defaultCode]
    )

    if (existing.rows[0]?.id) {
      await client.query(
        `update ${schemaQ}.store_currency
         set is_default = true, deleted_at = null, updated_at = now()
         where id = $1`,
        [existing.rows[0].id]
      )
    } else {
      await client.query(
        `insert into ${schemaQ}.store_currency
           (id, currency_code, store_id, is_default, created_at, updated_at)
         values ($1, $2, $3, true, now(), now())`,
        [newId("stocur"), defaultCode, store.id]
      )
    }

    await client.query(
      `update ${schemaQ}.store_currency
       set is_default = false, updated_at = now()
       where store_id = $1 and deleted_at is null and lower(currency_code) <> $2`,
      [store.id, defaultCode]
    )
  }

  const enabled = await client.query(
    `select count(*)::int as c from ${schemaQ}.store_currency
     where deleted_at is null`
  )

  return {
    stores: stores.rows.length,
    enabled: enabled.rows[0]?.c ?? 0,
    removed,
  }
}

const url = loadEnv("DATABASE_URL")
const client = new pg.Client({
  connectionString: url,
  ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false },
})

await client.connect()

const tenants = await client.query(
  slugArg
    ? `select slug, database_schema from public.skrepayshop_tenants where slug = $1`
    : `select slug, database_schema from public.skrepayshop_tenants
       where database_schema is not null order by created_at desc`,
  slugArg ? [slugArg] : []
)

for (const tenant of tenants.rows) {
  const report = await resetStoreEnabledCurrencies(
    client,
    tenant.database_schema
  )
  console.log(tenant.slug, tenant.database_schema, report)
}

await client.end()
