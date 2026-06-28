import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SKREPAY_REGION_MODULE } from "../../../modules/skrepay_region"
import { requireTenantFromRequest } from "../../../lib/tenant-context"

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
 * Returns only the regions belonging to the authenticated tenant
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const tenant = await requireTenantFromRequest(req)
    const regionService = req.scope.resolve(SKREPAY_REGION_MODULE) as any

    const regions = await regionService.listSkrepayRegions({ tenant_id: tenant.id })

    const full = await Promise.all(
      regions.map((r: any) => buildFullRegion(regionService, r.id))
    )

    res.json({ regions: full })
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Unauthorized"
    res.status(message === "Unauthorized" ? 401 : 400).json({ message })
  }
}

/**
 * POST /admin/skrepay-regions
 * Body: { name, status?, countries?: [{ iso_2, display_name }], currencies?: [{ currency_code, is_default }] }
 * Region is automatically scoped to the authenticated tenant
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const tenant = await requireTenantFromRequest(req)
    const regionService = req.scope.resolve(SKREPAY_REGION_MODULE) as any
    const { name, status = "draft", countries = [], currencies = [] } = req.body as any

    if (!name?.trim()) {
      return res.status(400).json({ message: "El nombre de la región es requerido." })
    }

    // tenant_id is injected automatically — the user cannot override it
    const region = await regionService.createSkrepayRegions({
      tenant_id: tenant.id,
      name: name.trim(),
      status,
    })

    for (const c of countries) {
      await regionService.createSkrepayRegionCountries({
        skrepay_region_id: region.id,
        iso_2: c.iso_2,
        display_name: c.display_name,
      })
    }

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
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Error al crear la región"
    res.status(message === "Unauthorized" ? 401 : 400).json({ message })
  }
}
