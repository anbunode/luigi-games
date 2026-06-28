import { Client } from "pg"
import type { MedusaRequest } from "@medusajs/framework/http"
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

export type StoreCurrencyScope = "catalog" | "pricing" | "regions"

export type StoreCurrencyRow = {
  id: string
  currency_code: string
  is_default: boolean
  store_id: string
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export const STORE_CURRENCY_SCOPE_HEADER = "x-skrepay-currency-scope"

export function readStoreCurrencyScopeFromRequest(input: {
  currency_scope?: unknown
  skrepay_currency_scope?: unknown
  header_scope?: unknown
}): StoreCurrencyScope {
  const raw =
    input.header_scope ?? input.currency_scope ?? input.skrepay_currency_scope

  if (raw === "catalog" || raw === "pricing" || raw === "regions") {
    return raw
  }

  return "regions"
}

export function readStoreCurrencyScopeFromMedusaRequest(
  req: MedusaRequest
): StoreCurrencyScope {
  const raw = req.headers[STORE_CURRENCY_SCOPE_HEADER]

  return readStoreCurrencyScopeFromRequest({
    header_scope: typeof raw === "string" ? raw : undefined,
  })
}

export async function loadStoreCurrenciesForScope(
  schema: string,
  storeId: string,
  scope: StoreCurrencyScope
): Promise<StoreCurrencyRow[]> {
  if (scope === "catalog") {
    return loadStoreEnabledCurrencies(schema, storeId)
  }

  if (scope === "pricing") {
    return loadProductPricingCurrencies(schema, storeId)
  }

  return loadRegionStoreCurrencies(schema, storeId)
}

async function loadStoreEnabledCurrencies(
  schema: string,
  storeId: string
): Promise<StoreCurrencyRow[]> {
  const schemaQ = quoteIdent(schema)
  const result = await getPlatformPool().query<StoreCurrencyRow>(
    `select
       id, currency_code, is_default, store_id, created_at, updated_at, deleted_at
     from ${schemaQ}.store_currency
     where deleted_at is null and store_id = $1
     order by is_default desc, currency_code asc`,
    [storeId]
  )

  return result.rows
}

export type AdminStoreCurrencyRow = StoreCurrencyRow & {
  currency: {
    code: string
    symbol: string
    symbol_native: string
    name: string
    decimal_digits: number
    rounding: number | string
  }
}

/** Formato nativo Medusa AdminStoreCurrency (con relación currency) */
export async function loadStoreEnabledCurrenciesForAdmin(
  schema: string,
  storeId: string
): Promise<AdminStoreCurrencyRow[]> {
  const schemaQ = quoteIdent(schema)
  const result = await getPlatformPool().query<{
    id: string
    currency_code: string
    is_default: boolean
    store_id: string
    created_at: Date
    updated_at: Date
    deleted_at: Date | null
    c_code: string
    symbol: string
    symbol_native: string
    name: string
    decimal_digits: number
    rounding: number | string
  }>(
    `select
       sc.id,
       sc.currency_code,
       sc.is_default,
       sc.store_id,
       sc.created_at,
       sc.updated_at,
       sc.deleted_at,
       c.code as c_code,
       c.symbol,
       c.symbol_native,
       c.name,
       c.decimal_digits,
       c.rounding
     from ${schemaQ}.store_currency sc
     inner join ${schemaQ}.currency c
       on lower(c.code) = lower(sc.currency_code) and c.deleted_at is null
     where sc.deleted_at is null and sc.store_id = $1
     order by sc.is_default desc, sc.currency_code asc`,
    [storeId]
  )

  return result.rows.map((row) => ({
    id: row.id,
    currency_code: row.currency_code,
    is_default: row.is_default,
    store_id: row.store_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
    currency: {
      code: row.c_code,
      symbol: row.symbol,
      symbol_native: row.symbol_native,
      name: row.name,
      decimal_digits: row.decimal_digits,
      rounding: row.rounding,
    },
  }))
}

/** Catálogo maestro (tabla currency) para selectores al crear regiones */
export async function loadMasterCurrencyCatalog(
  schema: string
): Promise<
  Array<{
    code: string
    symbol: string
    symbol_native: string
    name: string
    decimal_digits: number
  }>
> {
  const schemaQ = quoteIdent(schema)
  const result = await getPlatformPool().query<{
    code: string
    symbol: string
    symbol_native: string
    name: string
    decimal_digits: number
  }>(
    `select code, symbol, symbol_native, name, decimal_digits
     from ${schemaQ}.currency
     where deleted_at is null
     order by code asc`
  )

  return result.rows
}

/**
 * Monedas visibles al crear/editar productos:
 * moneda base + monedas de regiones publicadas en el panel (no filas huérfanas en BD).
 */
export async function buildProductPricingCurrencies(
  schema: string,
  storeId: string,
  adminRegionCurrencyCodes: string[]
): Promise<StoreCurrencyRow[]> {
  const schemaQ = quoteIdent(schema)
  const regionCodes = [
    ...new Set(
      adminRegionCurrencyCodes
        .map((code) => code.trim().toLowerCase())
        .filter(Boolean)
    ),
  ]

  const result = await getPlatformPool().query<StoreCurrencyRow>(
    `with pricing_codes as (
       select distinct lower(currency_code) as currency_code, min(priority) as priority
       from (
         select lower(currency_code) as currency_code, 0 as priority
         from ${schemaQ}.store_currency
         where store_id = $1 and deleted_at is null and is_default = true
         union all
         select lower(code) as currency_code, 1 as priority
         from unnest($2::text[]) as code
       ) codes
       group by lower(currency_code)
     ),
     default_code as (
       select lower(currency_code) as currency_code
       from ${schemaQ}.store_currency
       where store_id = $1 and deleted_at is null and is_default = true
       limit 1
     )
     select
       coalesce(sc.id, concat('stocur_', substr(md5($1 || ':' || pc.currency_code), 1, 26))) as id,
       pc.currency_code,
       (pc.currency_code = (select currency_code from default_code)) as is_default,
       $1::text as store_id,
       coalesce(sc.created_at, now()) as created_at,
       coalesce(sc.updated_at, now()) as updated_at,
       null::timestamptz as deleted_at
     from pricing_codes pc
     left join ${schemaQ}.store_currency sc
       on sc.store_id = $1
      and lower(sc.currency_code) = pc.currency_code
      and sc.deleted_at is null
     order by pc.priority asc, pc.currency_code asc`,
    [storeId, regionCodes]
  )

  if (result.rows.length > 0) {
    return result.rows
  }

  const fallback = await getPlatformPool().query<StoreCurrencyRow>(
    `select
       id, currency_code, is_default, store_id, created_at, updated_at, deleted_at
     from ${schemaQ}.store_currency
     where deleted_at is null and store_id = $1 and is_default = true
     limit 1`,
    [storeId]
  )

  return fallback.rows
}

/** @deprecated Usar buildProductPricingCurrencies con regiones del panel admin */
export async function loadProductPricingCurrencies(
  schema: string,
  storeId: string
): Promise<StoreCurrencyRow[]> {
  return buildProductPricingCurrencies(schema, storeId, [])
}

async function loadRegionStoreCurrencies(
  schema: string,
  storeId: string
): Promise<StoreCurrencyRow[]> {
  const schemaQ = quoteIdent(schema)
  const result = await getPlatformPool().query<StoreCurrencyRow>(
    `select
       coalesce(sc.id, concat('stocur_', substr(md5($1 || ':' || r.currency_code), 1, 26))) as id,
       lower(r.currency_code) as currency_code,
       coalesce(sc.is_default, false) as is_default,
       $1::text as store_id,
       coalesce(sc.created_at, now()) as created_at,
       coalesce(sc.updated_at, now()) as updated_at,
       null::timestamptz as deleted_at
     from (
       select distinct lower(currency_code) as currency_code
       from ${schemaQ}.region
       where deleted_at is null
     ) r
     left join ${schemaQ}.store_currency sc
       on sc.store_id = $1
      and lower(sc.currency_code) = r.currency_code
      and sc.deleted_at is null
     order by sc.is_default desc nulls last, r.currency_code asc`,
    [storeId]
  )

  if (result.rows.length > 0) {
    return result.rows
  }

  const fallback = await getPlatformPool().query<StoreCurrencyRow>(
    `select
       id, currency_code, is_default, store_id, created_at, updated_at, deleted_at
     from ${schemaQ}.store_currency
     where deleted_at is null and store_id = $1 and is_default = true
     limit 1`,
    [storeId]
  )

  return fallback.rows
}

export async function loadStoreCurrenciesForStores(
  schema: string,
  storeIds: string[],
  scope: StoreCurrencyScope
): Promise<Map<string, StoreCurrencyRow[]>> {
  const byStore = new Map<string, StoreCurrencyRow[]>()

  for (const storeId of storeIds) {
    byStore.set(storeId, await loadStoreCurrenciesForScope(schema, storeId, scope))
  }

  return byStore
}

export type StoreCurrencyInput = {
  currency_code: string
  is_default?: boolean
  is_tax_inclusive?: boolean
}

export async function setStoreDefaultCurrency(
  schema: string,
  storeId: string,
  currencyCode: string
): Promise<void> {
  const schemaQ = quoteIdent(schema)
  const pool = getPlatformPool()
  const code = currencyCode.toLowerCase()

  await pool.query(
    `update ${schemaQ}.store_currency
     set is_default = false, updated_at = now()
     where store_id = $1 and deleted_at is null`,
    [storeId]
  )

  await pool.query(
    `update ${schemaQ}.store_currency
     set is_default = true, updated_at = now()
     where store_id = $1 and deleted_at is null and currency_code = $2`,
    [storeId, code]
  )
}

/**
 * Solo la moneda base al provisionar una tienda nueva.
 * El catálogo completo vive en la tabla `currency`; el usuario activa monedas en Ajustes → Tienda.
 */
export async function seedDefaultStoreCurrency(
  connectionString: string,
  schema: string,
  storeId: string,
  defaultCurrencyCode = "usd"
): Promise<void> {
  const schemaQ = quoteIdent(schema)
  const client = new Client({
    connectionString: connectionString.split("?")[0],
    ssl: sslForUrl(connectionString),
  })

  await client.connect()

  try {
    const code = defaultCurrencyCode.toLowerCase()
    const existing = await client.query<{ id: string }>(
      `select id from ${schemaQ}.store_currency
       where store_id = $1 and currency_code = $2 and deleted_at is null`,
      [storeId, code]
    )

    if (!existing.rows[0]?.id) {
      await client.query(
        `insert into ${schemaQ}.store_currency
           (id, currency_code, store_id, is_default, created_at, updated_at)
         values ($1, $2, $3, true, now(), now())`,
        [generateEntityId(undefined, "stocur"), code, storeId]
      )
    } else {
      await client.query(
        `update ${schemaQ}.store_currency
         set is_default = true, deleted_at = null, updated_at = now()
         where id = $1`,
        [existing.rows[0].id]
      )
    }

    await client.query(
      `update ${schemaQ}.store_currency
       set is_default = false, updated_at = now()
       where store_id = $1 and deleted_at is null and currency_code <> $2`,
      [storeId, code]
    )
  } finally {
    await client.end()
  }
}

/**
 * @deprecated No enlazar todas las monedas a la tienda; usar seedDefaultStoreCurrency.
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

export async function syncStoreCurrencyPricePreferences(
  schema: string,
  currencies: StoreCurrencyInput[]
): Promise<void> {
  const schemaQ = quoteIdent(schema)
  const pool = getPlatformPool()
  const codes = currencies.map((entry) => entry.currency_code.toLowerCase())

  await pool.query(
    `update ${schemaQ}.price_preference
     set deleted_at = now(), updated_at = now()
     where deleted_at is null
       and attribute = 'currency_code'
       and not (lower(value) = any($1::text[]))`,
    [codes]
  )

  for (const entry of currencies) {
    if (entry.is_tax_inclusive === undefined) {
      continue
    }

    const code = entry.currency_code.toLowerCase()
    const existing = await pool.query<{ id: string }>(
      `select id from ${schemaQ}.price_preference
       where attribute = 'currency_code' and lower(value) = $1
       order by deleted_at nulls first
       limit 1`,
      [code]
    )

    if (existing.rows[0]?.id) {
      await pool.query(
        `update ${schemaQ}.price_preference
         set is_tax_inclusive = $2, deleted_at = null, updated_at = now()
         where id = $1`,
        [existing.rows[0].id, entry.is_tax_inclusive]
      )
      continue
    }

    await pool.query(
      `insert into ${schemaQ}.price_preference
         (id, attribute, value, is_tax_inclusive, created_at, updated_at)
       values ($1, 'currency_code', $2, $3, now(), now())`,
      [generateEntityId(undefined, "ppref"), code, entry.is_tax_inclusive]
    )
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
         and not (lower(currency_code) = any($2::text[]))`,
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

    await syncStoreCurrencyPricePreferences(schema, currencies)

    await pool.query("commit")
  } catch (error) {
    await pool.query("rollback")
    throw error
  }
}
