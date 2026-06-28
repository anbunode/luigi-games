import { Client } from "pg"
import { generateEntityId } from "@medusajs/framework/utils"
import { getPlatformPool } from "./platform-db"

function quoteIdent(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

function sslForUrl(connectionString: string) {
  return connectionString.includes("localhost")
    ? undefined
    : { rejectUnauthorized: false }
}

export type StoreCurrencyInput = {
  currency_code: string
  is_default?: boolean
}

/**
 * Enlaza todas las monedas del catálogo Medusa (tabla currency) a la tienda.
 * Así el panel nativo muestra el listado completo en regiones y en editar tienda.
 */
export async function seedAllStoreCurrencies(
  connectionString: string,
  schema: string,
  storeId: string,
  defaultCurrencyCode = "eur"
): Promise<{ added: number; total: number }> {
  const schemaQ = quoteIdent(schema)
  const client = new Client({
    connectionString: connectionString.split("?")[0],
    ssl: sslForUrl(connectionString),
  })

  await client.connect()

  try {
    const currencies = await client.query<{ code: string }>(
      `select code from ${schemaQ}.currency where deleted_at is null order by code asc`
    )

    let added = 0
    const defaultCode = defaultCurrencyCode.toLowerCase()

    for (const { code } of currencies.rows) {
      const existing = await client.query<{ id: string }>(
        `select id from ${schemaQ}.store_currency
         where store_id = $1 and currency_code = $2 and deleted_at is null`,
        [storeId, code]
      )

      if (existing.rows[0]?.id) {
        continue
      }

      await client.query(
        `insert into ${schemaQ}.store_currency
           (id, currency_code, store_id, is_default, created_at, updated_at)
         values ($1, $2, $3, $4, now(), now())
         on conflict do nothing`,
        [
          generateEntityId(undefined, "stocur"),
          code,
          storeId,
          code === defaultCode,
        ]
      )
      added++
    }

    await client.query(
      `update ${schemaQ}.store_currency
       set is_default = (currency_code = $2), updated_at = now()
       where store_id = $1 and deleted_at is null`,
      [storeId, defaultCode]
    )

    const total = await client.query<{ c: number }>(
      `select count(*)::int as c from ${schemaQ}.store_currency
       where store_id = $1 and deleted_at is null`,
      [storeId]
    )

    return { added, total: total.rows[0]?.c ?? 0 }
  } finally {
    await client.end()
  }
}

export async function syncStoreSupportedCurrencies(
  schema: string,
  storeId: string,
  currencies: StoreCurrencyInput[]
): Promise<void> {
  if (!currencies.length) {
    return
  }

  const schemaQ = quoteIdent(schema)
  const pool = getPlatformPool()
  const codes = currencies.map((c) => c.currency_code.toLowerCase())
  const defaultCode =
    currencies.find((c) => c.is_default)?.currency_code.toLowerCase() ??
    codes[0]

  await pool.query("begin")

  try {
    await pool.query(
      `update ${schemaQ}.store_currency
       set deleted_at = now(), updated_at = now()
       where store_id = $1 and deleted_at is null
         and not (currency_code = any($2::text[]))`,
      [storeId, codes]
    )

    for (const entry of currencies) {
      const code = entry.currency_code.toLowerCase()
      const isDefault = code === defaultCode
      const existing = await pool.query<{ id: string; deleted_at: Date | null }>(
        `select id, deleted_at from ${schemaQ}.store_currency
         where store_id = $1 and currency_code = $2
         order by deleted_at nulls first
         limit 1`,
        [storeId, code]
      )

      if (existing.rows[0]?.id) {
        await pool.query(
          `update ${schemaQ}.store_currency
           set is_default = $2, deleted_at = null, updated_at = now()
           where id = $1`,
          [existing.rows[0].id, isDefault]
        )
      } else {
        await pool.query(
          `insert into ${schemaQ}.store_currency
             (id, currency_code, store_id, is_default, created_at, updated_at)
           values ($1, $2, $3, $4, now(), now())`,
          [generateEntityId(undefined, "stocur"), code, storeId, isDefault]
        )
      }
    }

    await pool.query(
      `update ${schemaQ}.store_currency
       set is_default = false, updated_at = now()
       where store_id = $1 and deleted_at is null and currency_code <> $2`,
      [storeId, defaultCode]
    )

    await pool.query(
      `update ${schemaQ}.store_currency
       set is_default = true, updated_at = now()
       where store_id = $1 and deleted_at is null and currency_code = $2`,
      [storeId, defaultCode]
    )

    await pool.query("commit")
  } catch (error) {
    await pool.query("rollback")
    throw error
  }
}
