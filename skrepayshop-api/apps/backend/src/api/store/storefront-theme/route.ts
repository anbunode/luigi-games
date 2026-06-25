import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import StorefrontThemeModuleService from "../../../modules/storefront-theme/service"
import { STOREFRONT_THEME_MODULE } from "../../../modules/storefront-theme"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service: StorefrontThemeModuleService = req.scope.resolve(
    STOREFRONT_THEME_MODULE
  )

  const theme = await service.retrieveSettings()

  res.json({ theme })
}
