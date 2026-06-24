import { MedusaService } from "@medusajs/framework/utils"
import StorefrontTheme from "./models/storefront-theme"
import { DEFAULT_STOREFRONT_THEME } from "./types"

class StorefrontThemeModuleService extends MedusaService({
  StorefrontTheme,
}) {
  async retrieveSettings() {
    const [existing] = await this.listStorefrontThemes({}, { take: 1 })

    if (existing) {
      return existing
    }

    return await this.createStorefrontThemes(DEFAULT_STOREFRONT_THEME)
  }

  async updateSettings(data: Record<string, unknown>) {
    const current = await this.retrieveSettings()

    return await this.updateStorefrontThemes({
      id: current.id,
      ...data,
    })
  }
}

export default StorefrontThemeModuleService
