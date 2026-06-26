import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPrimaryStorefrontUrl } from "../../../lib/store-domains"
import { requireTenantFromRequest } from "../../../lib/tenant-context"
import StorefrontThemeModuleService from "../../../modules/storefront-theme/service"
import { STOREFRONT_THEME_MODULE } from "../../../modules/storefront-theme"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const tenant = await requireTenantFromRequest(req)
    const service: StorefrontThemeModuleService = req.scope.resolve(
      STOREFRONT_THEME_MODULE
    )
    const primaryUrl = (await getPrimaryStorefrontUrl(tenant.id)) ?? ""
    const theme = await service.retrieveSettingsForTenant(tenant.id, primaryUrl)

    res.json({ theme, primary_url: primaryUrl, tenant_slug: tenant.slug })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized"
    res.status(message === "Unauthorized" ? 401 : 400).json({ message })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const tenant = await requireTenantFromRequest(req)
    const service: StorefrontThemeModuleService = req.scope.resolve(
      STOREFRONT_THEME_MODULE
    )
    const primaryUrl = (await getPrimaryStorefrontUrl(tenant.id)) ?? ""
    const theme = await service.updateSettingsForTenant(
      tenant.id,
      req.body as Record<string, unknown>,
      primaryUrl
    )

    res.json({ theme, primary_url: primaryUrl })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo guardar el tema"
    res.status(400).json({ message })
  }
}
