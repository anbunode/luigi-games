/**
 * Crea tax_region + tax_rate y activa automatic_taxes para regiones existentes.
 *
 * Uso:
 *   node scripts/repair-tenant-tax-regions.mjs
 *   node scripts/repair-tenant-tax-regions.mjs luigi-game
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

const TAX_RATES = {
  es: 21,
  ve: 16,
  de: 19,
  fr: 20,
  it: 22,
  pt: 23,
  mx: 16,
  co: 19,
  ar: 21,
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

function generateId(prefix) {
  const chars = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
  let id = ""
  const bytes = randomBytes(16)
  for (let i = 0; i < 26; i++) {
    id += chars[bytes[i % bytes.length] % chars.length]
  }
  return `${prefix}_${id}`
}

async function syncRegionTaxes(client, schema, regionId) {
  const schemaQ = quoteIdent(schema)
  const countries = await client.query(
    `select lower(iso_2) as iso_2, display_name
     from ${schemaQ}.region_country
     where deleted_at is null and region_id = $1`,
    [regionId]
  )

  let taxRegions = 0
  let taxRates = 0
  let hasTax = false

  for (const country of countries.rows) {
    const iso2 = country.iso_2
    const rate = TAX_RATES[iso2]
    if (rate === undefined) continue

    hasTax = true

    let taxRegion = await client.query(
      `select id from ${schemaQ}.tax_region
       where deleted_at is null and lower(country_code) = $1 and provider_id = 'tp_system'
       limit 1`,
      [iso2]
    )

    let taxRegionId = taxRegion.rows[0]?.id
    if (!taxRegionId) {
      taxRegionId = generateId("txreg")
      await client.query(
        `insert into ${schemaQ}.tax_region (id, provider_id, country_code, created_at, updated_at)
         values ($1, 'tp_system', $2, now(), now())`,
        [taxRegionId, iso2]
      )
      taxRegions++
    }

    const code = `vat_${iso2}`
    const name = `IVA ${country.display_name ?? iso2.toUpperCase()} (${rate}%)`
    const existing = await client.query(
      `select id from ${schemaQ}.tax_rate where deleted_at is null and tax_region_id = $1 and code = $2`,
      [taxRegionId, code]
    )

    if (existing.rows[0]?.id) {
      await client.query(
        `update ${schemaQ}.tax_rate set rate = $2, name = $3, is_default = true, updated_at = now() where id = $1`,
        [existing.rows[0].id, rate, name]
      )
    } else {
      await client.query(
        `insert into ${schemaQ}.tax_rate
           (id, rate, code, name, is_default, is_combinable, tax_region_id, created_at, updated_at)
         values ($1, $2, $3, $4, true, false, $5, now(), now())`,
        [generateId("txrt"), rate, code, name, taxRegionId]
      )
      taxRates++
    }
  }

  await client.query(
    `update ${schemaQ}.region set automatic_taxes = $2, updated_at = now() where id = $1`,
    [regionId, hasTax]
  )

  return { taxRegions, taxRates, automatic_taxes: hasTax }
}

const url = loadEnv("DATABASE_URL")
const client = new pg.Client({
  connectionString: url,
  ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false },
})

await client.connect()

const tenants = slugArg
  ? await client.query(
      `select slug, database_schema from public.skrepayshop_tenants where slug = $1`,
      [slugArg]
    )
  : await client.query(
      `select slug, database_schema from public.skrepayshop_tenants
       where database_schema is not null and database_status = 'active'`
    )

for (const tenant of tenants.rows) {
  const schema = tenant.database_schema
  const schemaQ = quoteIdent(schema)
  const regions = await client.query(
    `select id, name from ${schemaQ}.region where deleted_at is null`
  )

  console.log(`\n${tenant.slug} (${schema})`)
  for (const region of regions.rows) {
    const result = await syncRegionTaxes(client, schema, region.id)
    console.log(`  ${region.name}:`, result)
  }
}

await client.end()
console.log("\nDone.")
