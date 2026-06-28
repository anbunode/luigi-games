import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SKREPAY_REGION_MODULE } from "../../../modules/skrepay_region"

/** Assembles a full region object with countries and currencies */
async function buildFullRegion(regionService: any, regionId: string) {
  const region = await regionService.retrieveSkrepayRegion(regionId)
  const [countries, currencies] = await Promise.all([
    regionService.listSkrepayRegionCountries({ skrepay_region_id: regionId }),
    regionService.listSkrepayRegionCurrencies({ skrepay_region_id: regionId }),
  ])
  return { ...region, countries, currencies }
}

/**
 * GET /admin/skrepay-regions
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const regionService = req.scope.resolve(SKREPAY_REGION_MODULE) as any

  const regions = await regionService.listSkrepayRegions({})

  const full = await Promise.all(
    regions.map((r: any) => buildFullRegion(regionService, r.id))
  )

  res.json({ regions: full })
}

/**
 * POST /admin/skrepay-regions
 * Body: { name, status?, countries?: [{ iso_2, display_name }], currencies?: [{ currency_code, is_default }] }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const regionService = req.scope.resolve(SKREPAY_REGION_MODULE) as any
  const { name, status = "draft", countries = [], currencies = [] } = req.body as any

  if (!name?.trim()) {
    return res.status(400).json({ message: "El nombre de la región es requerido." })
  }

  const region = await regionService.createSkrepayRegions({
    name: name.trim(),
    status,
  })

  // Attach countries
  for (const c of countries) {
    await regionService.createSkrepayRegionCountries({
      skrepay_region_id: region.id,
      iso_2: c.iso_2,
      display_name: c.display_name,
    })
  }

  // Attach currencies — auto-assign first as default if none flagged
  const hasDefault = currencies.some((c: any) => c.is_default)
  for (let i = 0; i < currencies.length; i++) {
    await regionService.createSkrepayRegionCurrencies({
      skrepay_region_id: region.id,
      currency_code: currencies[i].currency_code,
      is_default: hasDefault ? currencies[i].is_default : i === 0,
    })
  }

  const full = await buildFullRegion(regionService, region.id)
  res.status(201).json({ region: full })
}
