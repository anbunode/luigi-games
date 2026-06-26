import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { setPrimaryDomain } from "../../../../../lib/store-domains"
import { requireTenantFromRequest } from "../../../../../lib/tenant-context"
import StorefrontThemeModuleService from "../../../../../modules/storefront-theme/service"
import { STOREFRONT_THEME_MODULE } from "../../../../../modules/storefront-theme"
import { getPrimaryStorefrontUrl } from "../../../../../lib/store-domains"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const tenant = await requireTenantFromRequest(req)
    const id = req.params.id as string
    const domain = await setPrimaryDomain(tenant.id, id)
    const primaryUrl = await getPrimaryStorefrontUrl(tenant.id)

    const themeService: StorefrontThemeModuleService = req.scope.resolve(
      STOREFRONT_THEME_MODULE
    )
    await themeService.updateSettingsForTenant(
      tenant.id,
      {},
      primaryUrl ?? ""
    )

    res.json({ domain, primary_url: primaryUrl })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo actualizar el dominio"
    res.status(400).json({ message })
  }
}
