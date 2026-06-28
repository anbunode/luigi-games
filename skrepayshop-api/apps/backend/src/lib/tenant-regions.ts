import { generateEntityId } from "@medusajs/framework/utils"
import { getPlatformPool } from "./platform-db"
import { resolveCountryRecord, type CountryInput } from "./country-catalog"

export type RegionStatus = "active" | "draft"

export type RegionCurrency = {
  id?: string
  currency_code: string
  is_default: boolean
}

export type RegionCountry = {
  id?: string
  iso_2: string
  display_name: string
}

export type SkrepayRegion = {
  id: string
  name: string
  status: RegionStatus
  countries: RegionCountry[]
  currencies: RegionCurrency[]
  currency_code: string
  automatic_taxes: boolean
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export type CurrencyInput = {
  currency_code: string
  is_default: boolean
}

export type CreateRegionInput = {
  name: string
  status?: RegionStatus
  countries?: CountryInput[]
  currencies?: CurrencyInput[]
}

export type UpdateRegionInput = Partial<CreateRegionInput>

type DbRegionRow = {
  id: string
  name: string
  currency_code: string
  automatic_taxes: boolean
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

type DbCountryRow = {
  iso_2: string
  display_name: string
}

function quoteSchema(schema: string): string {
  return `"${schema.replace(/"/g, '""')}"`
}

function normalizeCurrency(code: string): string {
  return code.trim().toLowerCase()
}

function parseMetadata(rawMetadata: unknown): {
  status: RegionStatus
  currencies: RegionCurrency[]
} {
  let metadata: Record<string, unknown> | null = null

  if (typeof rawMetadata === "string") {
    try {
      metadata = JSON.parse(rawMetadata) as Record<string, unknown>
    } catch {
      metadata = null
    }
  } else if (rawMetadata && typeof rawMetadata === "object") {
    metadata = rawMetadata as Record<string, unknown>
  }

  const status =
    metadata?.skrepay_status === "draft" ? "draft" : "active"

  const raw = metadata?.skrepay_currencies
  if (Array.isArray(raw)) {
    const currencies = raw
      .filter((item) => item && typeof item === "object")
      .map((item) => {
        const row = item as Record<string, unknown>
        return {
          currency_code: normalizeCurrency(String(row.currency_code ?? "")),
          is_default: Boolean(row.is_default),
        }
      })
      .filter((item) => item.currency_code)

    if (currencies.length > 0) {
      if (!currencies.some((c) => c.is_default)) {
        currencies[0].is_default = true
      }
      return { status, currencies }
    }
  }

  return { status, currencies: [] }
}

function buildMetadata(
  status: RegionStatus,
  currencies: RegionCurrency[],
  existing: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  return {
    ...(existing ?? {}),
    skrepay_status: status,
    skrepay_currencies: currencies.map((c) => ({
      currency_code: normalizeCurrency(c.currency_code),
      is_default: c.is_default,
    })),
  }
}

function normalizeCurrencies(
  input: CurrencyInput[] | undefined,
  fallbackCode?: string
): RegionCurrency[] {
  if (input?.length) {
    const hasDefault = input.some((c) => c.is_default)
    return input.map((c, index) => ({
      currency_code: normalizeCurrency(c.currency_code),
      is_default: hasDefault ? Boolean(c.is_default) : index === 0,
    }))
  }

  if (fallbackCode) {
    return [{ currency_code: normalizeCurrency(fallbackCode), is_default: true }]
  }

  return []
}

function defaultCurrencyCode(currencies: RegionCurrency[]): string {
  const found = currencies.find((c) => c.is_default) ?? currencies[0]
  return found?.currency_code ?? "usd"
}

function assembleRegion(
  row: DbRegionRow,
  countries: DbCountryRow[]
): SkrepayRegion {
  const parsed = parseMetadata(row.metadata)
  const currencies =
    parsed.currencies.length > 0
      ? parsed.currencies
      : row.currency_code
        ? [{ currency_code: row.currency_code, is_default: true }]
        : []

  return {
    id: row.id,
    name: row.name,
    status: parsed.status,
    countries: countries.map((c) => ({
      iso_2: c.iso_2.toUpperCase(),
      display_name: c.display_name,
    })),
    currencies,
    currency_code: row.currency_code,
    automatic_taxes: row.automatic_taxes,
    metadata: row.metadata,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

async function fetchCountriesForRegion(
  schema: string,
  regionId: string
): Promise<DbCountryRow[]> {
  const result = await getPlatformPool().query<DbCountryRow>(
    `select iso_2, display_name
     from ${quoteSchema(schema)}.region_country
     where region_id = $1 and deleted_at is null
     order by display_name asc`,
    [regionId]
  )
  return result.rows
}

async function fetchRegionRow(
  schema: string,
  regionId: string
): Promise<DbRegionRow | null> {
  const result = await getPlatformPool().query<DbRegionRow>(
    `select id, name, currency_code, automatic_taxes, metadata, created_at, updated_at
     from ${quoteSchema(schema)}.region
     where id = $1 and deleted_at is null`,
    [regionId]
  )
  return result.rows[0] ?? null
}

async function releaseCountries(
  schema: string,
  isoCodes: string[],
  exceptRegionId?: string
): Promise<void> {
  if (!isoCodes.length) return

  const normalized = isoCodes.map((c) => c.toLowerCase())
  const params: unknown[] = [normalized]
  let sql = `update ${quoteSchema(schema)}.region_country
             set deleted_at = now(), updated_at = now()
             where deleted_at is null
               and lower(iso_2) = any($1::text[])`

  if (exceptRegionId) {
    params.push(exceptRegionId)
    sql += ` and region_id <> $2`
  }

  await getPlatformPool().query(sql, params)
}

async function replaceCountries(
  schema: string,
  regionId: string,
  countries: CountryInput[]
): Promise<void> {
  const schemaQ = quoteSchema(schema)
  const pool = getPlatformPool()

  await pool.query(
    `update ${schemaQ}.region_country
     set deleted_at = now(), updated_at = now()
     where region_id = $1 and deleted_at is null`,
    [regionId]
  )

  const isoCodes = countries.map((c) => c.iso_2.toLowerCase())
  if (isoCodes.length) {
    await releaseCountries(schema, isoCodes, regionId)
  }

  for (const input of countries) {
    const country = resolveCountryRecord(input)
    await pool.query(
      `insert into ${schemaQ}.region_country (
         iso_2, iso_3, num_code, name, display_name, region_id, created_at, updated_at
       ) values ($1, $2, $3, $4, $5, $6, now(), now())
       on conflict (iso_2) do update set
         iso_3 = excluded.iso_3,
         num_code = excluded.num_code,
         name = excluded.name,
         display_name = excluded.display_name,
         region_id = excluded.region_id,
         deleted_at = null,
         updated_at = now()`,
      [
        country.iso_2.toLowerCase(),
        country.iso_3,
        country.num_code,
        country.name,
        country.display_name,
        regionId,
      ]
    )
  }
}

export async function listTenantRegions(
  schema: string | null | undefined
): Promise<SkrepayRegion[]> {
  if (!schema) {
    return []
  }

  const result = await getPlatformPool().query<DbRegionRow>(
    `select id, name, currency_code, automatic_taxes, metadata, created_at, updated_at
     from ${quoteSchema(schema)}.region
     where deleted_at is null
     order by created_at asc`
  )

  const regions: SkrepayRegion[] = []
  for (const row of result.rows) {
    const countries = await fetchCountriesForRegion(schema, row.id)
    regions.push(assembleRegion(row, countries))
  }

  return regions
}

export async function getTenantRegion(
  schema: string | null | undefined,
  regionId: string
): Promise<SkrepayRegion | null> {
  if (!schema) {
    return null
  }

  const row = await fetchRegionRow(schema, regionId)
  if (!row) {
    return null
  }

  const countries = await fetchCountriesForRegion(schema, regionId)
  return assembleRegion(row, countries)
}

export async function createTenantRegion(
  schema: string,
  input: CreateRegionInput
): Promise<SkrepayRegion> {
  const name = input.name.trim()
  if (!name) {
    throw new Error("El nombre de la región es requerido.")
  }

  const status: RegionStatus = input.status === "draft" ? "draft" : "active"
  let currencies = normalizeCurrencies(input.currencies)
  if (currencies.length === 0) {
    currencies = [{ currency_code: "usd", is_default: true }]
  }
  const currencyCode = defaultCurrencyCode(currencies)
  const regionId = generateEntityId(undefined, "reg")
  const metadata = buildMetadata(status, currencies, null)

  await getPlatformPool().query(
    `insert into ${quoteSchema(schema)}.region (
       id, name, currency_code, automatic_taxes, metadata, created_at, updated_at
     ) values ($1, $2, $3, false, $4, now(), now())`,
    [regionId, name, currencyCode, JSON.stringify(metadata)]
  )

  if (input.countries?.length) {
    await replaceCountries(schema, regionId, input.countries)
  }

  const created = await getTenantRegion(schema, regionId)
  if (!created) {
    throw new Error("No se pudo crear la región.")
  }

  return created
}

export async function updateTenantRegion(
  schema: string,
  regionId: string,
  input: UpdateRegionInput
): Promise<SkrepayRegion | null> {
  const existing = await fetchRegionRow(schema, regionId)
  if (!existing) {
    return null
  }

  const parsed = parseMetadata(existing.metadata)
  const nextStatus = input.status ?? parsed.status
  const nextCurrencies = input.currencies
    ? normalizeCurrencies(input.currencies)
    : parsed.currencies.length
      ? parsed.currencies
      : normalizeCurrencies(undefined, existing.currency_code)

  const nextName = input.name?.trim() || existing.name
  const currencyCode = defaultCurrencyCode(nextCurrencies)
  const metadata = buildMetadata(nextStatus, nextCurrencies, existing.metadata)

  await getPlatformPool().query(
    `update ${quoteSchema(schema)}.region
     set name = $2,
         currency_code = $3,
         metadata = $4,
         updated_at = now()
     where id = $1 and deleted_at is null`,
    [regionId, nextName, currencyCode, JSON.stringify(metadata)]
  )

  if (input.countries !== undefined) {
    await replaceCountries(schema, regionId, input.countries)
  }

  return getTenantRegion(schema, regionId)
}

export async function deleteTenantRegion(
  schema: string,
  regionId: string
): Promise<boolean> {
  const existing = await fetchRegionRow(schema, regionId)
  if (!existing) {
    return false
  }

  const schemaQ = quoteSchema(schema)
  const pool = getPlatformPool()

  await pool.query(
    `update ${schemaQ}.region_country
     set deleted_at = now(), updated_at = now()
     where region_id = $1 and deleted_at is null`,
    [regionId]
  )

  await pool.query(
    `update ${schemaQ}.region
     set deleted_at = now(), updated_at = now()
     where id = $1 and deleted_at is null`,
    [regionId]
  )

  return true
}
