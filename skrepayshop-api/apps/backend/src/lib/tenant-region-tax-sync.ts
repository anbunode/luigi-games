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

export async function syncTaxesForRegion(
  schema: string,
  regionId: string
): Promise<{ tax_regions: number; tax_rates: number; automatic_taxes: boolean }> {
  const schemaQ = quoteIdent(schema)
  const pool = getPlatformPool()

  const countries = await pool.query<RegionCountryRow>(
    `select lower(rc.iso_2) as iso_2, rc.display_name
     from ${schemaQ}.region_country rc
     where rc.deleted_at is null and rc.region_id = $1`,
    [regionId]
  )

  let taxRegions = 0
  let taxRates = 0
  let hasTaxableCountry = false

  await pool.query("begin")

  try {
    for (const country of countries.rows) {
      const iso2 = country.iso_2.toLowerCase()
      const taxPercent = getDefaultTaxRateForCountry(iso2)

      if (taxPercent === null) {
        continue
      }

      hasTaxableCountry = true

      const existingTaxRegion = await pool.query<{ id: string }>(
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
        await pool.query(
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

      const existingRate = await pool.query<{ id: string }>(
        `select id from ${schemaQ}.tax_rate
         where deleted_at is null and tax_region_id = $1 and code = $2
         limit 1`,
        [taxRegionId, rateCode]
      )

      if (existingRate.rows[0]?.id) {
        await pool.query(
          `update ${schemaQ}.tax_rate
           set rate = $2, name = $3, is_default = true, updated_at = now()
           where id = $1`,
          [existingRate.rows[0].id, taxPercent, rateName]
        )
      } else {
        await pool.query(
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

    await pool.query(
      `update ${schemaQ}.region
       set automatic_taxes = $2, updated_at = now()
       where id = $1 and deleted_at is null`,
      [regionId, hasTaxableCountry]
    )

    await pool.query("commit")
  } catch (error) {
    await pool.query("rollback")
    throw error
  }

  return {
    tax_regions: taxRegions,
    tax_rates: taxRates,
    automatic_taxes: hasTaxableCountry,
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
      result: await syncTaxesForRegion(schema, region.id),
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

export async function loadRegionTaxSummaries(
  schema: string
): Promise<RegionTaxSummary[]> {
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
