import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SKREPAY_REGION_MODULE } from "../../../modules/skrepay_region"

/**
 * GET /admin/skrepay-regions
 * Returns all regions with their countries and currencies
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const regionService = req.scope.resolve(SKREPAY_REGION_MODULE) as any

  const regions = await regionService.listSkrepayRegions(
    {},
    { relations: ["countries", "currencies"] }
  )

  res.json({ regions })
}

/**
 * POST /admin/skrepay-regions
 * Body: { name, status, countries: [{ iso_2, display_name }], currencies: [{ currency_code, is_default }] }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const regionService = req.scope.resolve(SKREPAY_REGION_MODULE) as any
  const { name, status = "draft", countries = [], currencies = [] } = req.body as any

  if (!name?.trim()) {
    return res.status(400).json({ message: "El nombre de la región es requerido." })
  }

  // Create the main region record
  const region = await regionService.createSkrepayRegions({ name: name.trim(), status })

  // Attach countries
  if (countries.length > 0) {
    for (const c of countries) {
      await regionService.createSkrepayRegionCountries({
        skrepay_region_id: region.id,
        iso_2: c.iso_2,
        display_name: c.display_name,
      })
    }
  }

  // Attach currencies — ensure at least one is_default
  if (currencies.length > 0) {
    const hasDefault = currencies.some((c: any) => c.is_default)
    for (let i = 0; i < currencies.length; i++) {
      await regionService.createSkrepayRegionCurrencies({
        skrepay_region_id: region.id,
        currency_code: currencies[i].currency_code,
        is_default: hasDefault ? currencies[i].is_default : i === 0,
      })
    }
  }

  // Return the full region with relations
  const full = await regionService.retrieveSkrepayRegion(region.id, {
    relations: ["countries", "currencies"],
  })

  res.status(201).json({ region: full })
}
