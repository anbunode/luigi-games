import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SKREPAY_REGION_MODULE } from "../../../../modules/skrepay_region"

async function buildFullRegion(regionService: any, regionId: string) {
  const region = await regionService.retrieveSkrepayRegion(regionId)
  const [countries, currencies] = await Promise.all([
    regionService.listSkrepayRegionCountries({ skrepay_region_id: regionId }),
    regionService.listSkrepayRegionCurrencies({ skrepay_region_id: regionId }),
  ])
  return { ...region, countries, currencies }
}

/**
 * GET /admin/skrepay-regions/:id
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const regionService = req.scope.resolve(SKREPAY_REGION_MODULE) as any
  const { id } = req.params

  try {
    const full = await buildFullRegion(regionService, id)
    res.json({ region: full })
  } catch {
    res.status(404).json({ message: "Región no encontrada." })
  }
}

/**
 * PUT /admin/skrepay-regions/:id
 * Full-replace strategy for countries and currencies
 */
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const regionService = req.scope.resolve(SKREPAY_REGION_MODULE) as any
  const { id } = req.params
  const { name, status, countries, currencies } = req.body as any

  // Verify exists
  try {
    await regionService.retrieveSkrepayRegion(id)
  } catch {
    return res.status(404).json({ message: "Región no encontrada." })
  }

  // Update scalar fields
  const updatePayload: Record<string, any> = {}
  if (name !== undefined) updatePayload.name = name.trim()
  if (status !== undefined) updatePayload.status = status
  if (Object.keys(updatePayload).length > 0) {
    await regionService.updateSkrepayRegions({ id }, updatePayload)
  }

  // Replace countries
  if (countries !== undefined) {
    const existing = await regionService.listSkrepayRegionCountries({ skrepay_region_id: id })
    if (existing.length > 0) {
      await regionService.deleteSkrepayRegionCountries(existing.map((c: any) => c.id))
    }
    for (const c of countries) {
      await regionService.createSkrepayRegionCountries({
        skrepay_region_id: id,
        iso_2: c.iso_2,
        display_name: c.display_name,
      })
    }
  }

  // Replace currencies
  if (currencies !== undefined) {
    const existing = await regionService.listSkrepayRegionCurrencies({ skrepay_region_id: id })
    if (existing.length > 0) {
      await regionService.deleteSkrepayRegionCurrencies(existing.map((c: any) => c.id))
    }
    const hasDefault = currencies.some((c: any) => c.is_default)
    for (let i = 0; i < currencies.length; i++) {
      await regionService.createSkrepayRegionCurrencies({
        skrepay_region_id: id,
        currency_code: currencies[i].currency_code,
        is_default: hasDefault ? currencies[i].is_default : i === 0,
      })
    }
  }

  const full = await buildFullRegion(regionService, id)
  res.json({ region: full })
}

/**
 * DELETE /admin/skrepay-regions/:id
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const regionService = req.scope.resolve(SKREPAY_REGION_MODULE) as any
  const { id } = req.params

  try {
    // Delete children first
    const [countries, currencies] = await Promise.all([
      regionService.listSkrepayRegionCountries({ skrepay_region_id: id }),
      regionService.listSkrepayRegionCurrencies({ skrepay_region_id: id }),
    ])
    if (countries.length) {
      await regionService.deleteSkrepayRegionCountries(countries.map((c: any) => c.id))
    }
    if (currencies.length) {
      await regionService.deleteSkrepayRegionCurrencies(currencies.map((c: any) => c.id))
    }
    await regionService.deleteSkrepayRegions([id])
    res.json({ deleted: true, id })
  } catch {
    res.status(404).json({ message: "Región no encontrada." })
  }
}
