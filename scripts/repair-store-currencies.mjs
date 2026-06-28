/**
 * Enlaza TODAS las monedas del catálogo Medusa a la tienda del tenant.
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

async function seedAllStoreCurrencies(client, schema, defaultCode = "eur") {
  const schemaQ = quoteIdent(schema)
  const stores = await client.query(
    `select id from ${schemaQ}.store where deleted_at is null`
  )

  if (stores.rows.length === 0) {
    return { stores: 0, added: 0, total: 0 }
  }

  const currencies = await client.query(
    `select code from ${schemaQ}.currency where deleted_at is null order by code asc`
  )

  let added = 0

  for (const store of stores.rows) {
    for (const { code } of currencies.rows) {
      const exists = await client.query(
        `select id from ${schemaQ}.store_currency
         where store_id = $1 and currency_code = $2 and deleted_at is null`,
        [store.id, code]
      )

      if (exists.rows[0]?.id) {
        continue
      }

      await client.query(
        `insert into ${schemaQ}.store_currency
           (id, currency_code, store_id, is_default, created_at, updated_at)
         values ($1, $2, $3, $4, now(), now())`,
        [newId("stocur"), code, store.id, code === defaultCode]
      )
      added++
    }

    await client.query(
      `update ${schemaQ}.store_currency
       set is_default = (currency_code = $2), updated_at = now()
       where store_id = $1 and deleted_at is null`,
      [store.id, defaultCode]
    )
  }

  const total = await client.query(
    `select count(*)::int as c from ${schemaQ}.store_currency
     where deleted_at is null`
  )

  return {
    stores: stores.rows.length,
    added,
    total: total.rows[0]?.c ?? 0,
    catalog: currencies.rows.length,
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
  const report = await seedAllStoreCurrencies(client, tenant.database_schema)
  console.log(tenant.slug, tenant.database_schema, report)
}

await client.end()
