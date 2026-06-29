import { generateEntityId } from "@medusajs/framework/utils"
import { getPlatformPool } from "./platform-db"
import {
  formatTaxPercent,
  getDefaultTaxRateForCountry,
} from "./country-default-tax-rates"

function quoteIdent(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

const TAX_PROVIDER_ID = "tp_system"

type RegionCountryRow = {
  iso_2: string
  display_name: string | null
}

export type SyncTaxesOptions = {
  /** Países del body/response cuando aún no están en region_country. */
  countryCodes?: string[]
  /** Si false, no crea tax regions (respeta desactivar impuestos). */
  automaticTaxes?: boolean
  /** Schema tenant preferido (desde middleware). */
  tenantSchema?: string
}

async function resolveRegionStorageSchema(
  tenantSchema: string,
  regionId: string
): Promise<string> {
  const pool = getPlatformPool()

  const inTenant = await pool.query(
    `select 1 from ${quoteIdent(tenantSchema)}.region
     where id = $1 and deleted_at is null limit 1`,
    [regionId]
  )

  if (inTenant.rows.length > 0) {
    return tenantSchema
  }

  const inPublic = await pool.query(
    `select 1 from public.region
     where id = $1 and deleted_at is null limit 1`,
    [regionId]
  )

  if (inPublic.rows.length > 0) {
    return "public"
  }

  return tenantSchema
}

async function loadRegionCountries(
  schema: string,
  regionId: string,
  overrideCodes?: string[]
): Promise<RegionCountryRow[]> {
  const schemaQ = quoteIdent(schema)
  const pool = getPlatformPool()

  const fromDb = await pool.query<RegionCountryRow>(
    `select lower(rc.iso_2) as iso_2, rc.display_name
     from ${schemaQ}.region_country rc
     where rc.deleted_at is null and rc.region_id = $1`,
    [regionId]
  )

  if (fromDb.rows.length > 0) {
    return fromDb.rows
  }

  if (!overrideCodes?.length) {
    return []
  }

  const codes = [...new Set(overrideCodes.map((c) => c.trim().toLowerCase()).filter(Boolean))]

  const catalog = await pool.query<RegionCountryRow>(
    `select lower(iso_2) as iso_2, display_name
     from ${schemaQ}.region_country
     where deleted_at is null and lower(iso_2) = any($1::text[])`,
    [codes]
  )

  const byCode = new Map(catalog.rows.map((row) => [row.iso_2, row]))

  return codes.map((iso2) => ({
    iso_2: iso2,
    display_name: byCode.get(iso2)?.display_name ?? iso2.toUpperCase(),
  }))
}

export async function syncTaxesForRegion(
  schema: string,
  regionId: string,
  options: SyncTaxesOptions = {}
): Promise<{ tax_regions: number; tax_rates: number; automatic_taxes: boolean; storage_schema: string }> {
  if (options.automaticTaxes === false) {
    const storageSchema = await resolveRegionStorageSchema(
      options.tenantSchema ?? schema,
      regionId
    )
    const schemaQ = quoteIdent(storageSchema)
    await getPlatformPool().query(
      `update ${schemaQ}.region
       set automatic_taxes = false, updated_at = now()
       where id = $1 and deleted_at is null`,
      [regionId]
    )
    return {
      tax_regions: 0,
      tax_rates: 0,
      automatic_taxes: false,
      storage_schema: storageSchema,
    }
  }

  const storageSchema = await resolveRegionStorageSchema(
    options.tenantSchema ?? schema,
    regionId
  )
  const schemaQ = quoteIdent(storageSchema)
  const pool = getPlatformPool()

  const countries = await loadRegionCountries(
    storageSchema,
    regionId,
    options.countryCodes
  )

  let taxRegions = 0
  let taxRates = 0
  let hasTaxableCountry = false

  for (const country of countries) {
    const iso2 = country.iso_2.toLowerCase()
    const taxPercent = getDefaultTaxRateForCountry(iso2)

    if (taxPercent === null) {
      continue
    }

    hasTaxableCountry = true

    const client = await pool.connect()

    try {
      await client.query("begin")

      const existingTaxRegion = await client.query<{ id: string }>(
        `select id from ${schemaQ}.tax_region
         where deleted_at is null
           and lower(country_code) = $1
           and provider_id = $2
           and province_code is null
         limit 1`,
        [iso2, TAX_PROVIDER_ID]
      )

      let taxRegionId = existingTaxRegion.rows[0]?.id

      if (!taxRegionId) {
        taxRegionId = generateEntityId(undefined, "txreg")
        await client.query(
          `insert into ${schemaQ}.tax_region
             (id, provider_id, country_code, created_at, updated_at)
           values ($1, $2, $3, now(), now())`,
          [taxRegionId, TAX_PROVIDER_ID, iso2]
        )
        taxRegions++
      }

      const rateLabel = formatTaxPercent(taxPercent)
      const rateCode = `vat_${iso2}`
      const rateName = `IVA ${country.display_name ?? iso2.toUpperCase()} (${rateLabel}%)`

      const existingRate = await client.query<{ id: string }>(
        `select id from ${schemaQ}.tax_rate
         where deleted_at is null and tax_region_id = $1 and code = $2
         limit 1`,
        [taxRegionId, rateCode]
      )

      if (existingRate.rows[0]?.id) {
        await client.query(
          `update ${schemaQ}.tax_rate
           set rate = $2, name = $3, is_default = true, updated_at = now()
           where id = $1`,
          [existingRate.rows[0].id, taxPercent, rateName]
        )
      } else {
        const existingDefault = await client.query<{ id: string }>(
          `select id from ${schemaQ}.tax_rate
           where deleted_at is null and tax_region_id = $1 and is_default = true
           limit 1`,
          [taxRegionId]
        )

        if (existingDefault.rows[0]?.id) {
          await client.query(
            `update ${schemaQ}.tax_rate
             set rate = $2, code = $3, name = $4, is_default = true, updated_at = now()
             where id = $1`,
            [existingDefault.rows[0].id, taxPercent, rateCode, rateName]
          )
        } else {
          await client.query(
            `insert into ${schemaQ}.tax_rate
               (id, rate, code, name, is_default, is_combinable, tax_region_id, created_at, updated_at)
             values ($1, $2, $3, $4, true, false, $5, now(), now())`,
            [
              generateEntityId(undefined, "txrt"),
              taxPercent,
              rateCode,
              rateName,
              taxRegionId,
            ]
          )
          taxRates++
        }
      }

      await client.query("commit")
    } catch (error) {
      await client.query("rollback")
      console.error(
        `[skrepay] tax sync failed for country ${iso2} in region ${regionId}:`,
        error
      )
    } finally {
      client.release()
    }
  }

  const enableTaxes = options.automaticTaxes ?? hasTaxableCountry

  await pool.query(
    `update ${schemaQ}.region
     set automatic_taxes = $2, updated_at = now()
     where id = $1 and deleted_at is null`,
    [regionId, enableTaxes && hasTaxableCountry]
  )

  return {
    tax_regions: taxRegions,
    tax_rates: taxRates,
    automatic_taxes: hasTaxableCountry,
    storage_schema: storageSchema,
  }
}

export async function syncTaxesForAllRegions(
  schema: string
): Promise<Array<{ region_id: string; name: string; result: Awaited<ReturnType<typeof syncTaxesForRegion>> }>> {
  const schemaQ = quoteIdent(schema)
  const pool = getPlatformPool()

  const regions = await pool.query<{ id: string; name: string }>(
    `select id, name from ${schemaQ}.region where deleted_at is null order by created_at asc`
  )

  const results: Array<{
    region_id: string
    name: string
    result: Awaited<ReturnType<typeof syncTaxesForRegion>>
  }> = []

  for (const region of regions.rows) {
    results.push({
      region_id: region.id,
      name: region.name,
      result: await syncTaxesForRegion(schema, region.id, { tenantSchema: schema }),
    })
  }

  return results
}

export type RegionTaxSummary = {
  region_id: string
  region_name: string
  currency_code: string
  automatic_taxes: boolean
  countries: Array<{
    iso_2: string
    display_name: string | null
    tax_percent: number | null
    tax_rate_name: string | null
  }>
}

async function resolvePrimaryRegionSchema(tenantSchema: string): Promise<string> {
  const pool = getPlatformPool()

  const tenantCount = await pool.query<{ c: number }>(
    `select count(*)::int as c from ${quoteIdent(tenantSchema)}.region where deleted_at is null`
  )

  if ((tenantCount.rows[0]?.c ?? 0) > 0) {
    return tenantSchema
  }

  const publicCount = await pool.query<{ c: number }>(
    `select count(*)::int as c from public.region where deleted_at is null`
  )

  if ((publicCount.rows[0]?.c ?? 0) > 0) {
    return "public"
  }

  return tenantSchema
}

export async function loadRegionTaxSummaries(
  tenantSchema: string
): Promise<RegionTaxSummary[]> {
  const schema = await resolvePrimaryRegionSchema(tenantSchema)
  const schemaQ = quoteIdent(schema)
  const pool = getPlatformPool()

  const regions = await pool.query<{
    id: string
    name: string
    currency_code: string
    automatic_taxes: boolean
  }>(
    `select id, name, currency_code, automatic_taxes
     from ${schemaQ}.region
     where deleted_at is null
     order by created_at asc`
  )

  const summaries: RegionTaxSummary[] = []

  for (const region of regions.rows) {
    const countries = await pool.query<{
      iso_2: string
      display_name: string | null
    }>(
      `select lower(iso_2) as iso_2, display_name
       from ${schemaQ}.region_country
       where deleted_at is null and region_id = $1
       order by display_name asc`,
      [region.id]
    )

    const countrySummaries: RegionTaxSummary["countries"] = []

    for (const country of countries.rows) {
      const iso2 = country.iso_2.toLowerCase()
      const defaultRate = getDefaultTaxRateForCountry(iso2)

      const rateRow = await pool.query<{ rate: string; name: string }>(
        `select tr.rate, tr.name
         from ${schemaQ}.tax_rate tr
         join ${schemaQ}.tax_region txr on txr.id = tr.tax_region_id
         where tr.deleted_at is null
           and txr.deleted_at is null
           and lower(txr.country_code) = $1
           and txr.provider_id = $2
         order by tr.is_default desc, tr.created_at asc
         limit 1`,
        [iso2, TAX_PROVIDER_ID]
      )

      const configuredRate = rateRow.rows[0]
        ? Number(rateRow.rows[0].rate)
        : null

      countrySummaries.push({
        iso_2: iso2,
        display_name: country.display_name,
        tax_percent: configuredRate ?? defaultRate,
        tax_rate_name: configuredRate
          ? rateRow.rows[0]?.name ?? null
          : defaultRate !== null
            ? `IVA estimado (${formatTaxPercent(defaultRate)}%)`
            : null,
      })
    }

    summaries.push({
      region_id: region.id,
      region_name: region.name,
      currency_code: region.currency_code,
      automatic_taxes: region.automatic_taxes,
      countries: countrySummaries,
    })
  }

  return summaries
}
