import { MedusaService } from "@medusajs/framework/utils"
import StorefrontTheme from "./models/storefront-theme"
import { DEFAULT_STOREFRONT_THEME } from "./types"

class StorefrontThemeModuleService extends MedusaService({
  StorefrontTheme,
}) {
  async retrieveSettingsForTenant(
    tenantId: string,
    storefrontPreviewUrl = ""
  ) {
    const [existing] = await this.listStorefrontThemes(
      { tenant_id: tenantId },
      { take: 1 }
    )

    if (existing) {
      return existing
    }

    return await this.createStorefrontThemes({
      ...DEFAULT_STOREFRONT_THEME,
      tenant_id: tenantId,
      storefront_preview_url: storefrontPreviewUrl,
    })
  }

  async updateSettingsForTenant(
    tenantId: string,
    data: Record<string, unknown>,
    storefrontPreviewUrl = ""
  ) {
    const current = await this.retrieveSettingsForTenant(
      tenantId,
      storefrontPreviewUrl
    )

    const { storefront_preview_url: _ignored, tenant_id: _tenant, ...rest } =
      data

    return await this.updateStorefrontThemes({
      id: current.id,
      tenant_id: tenantId,
      storefront_preview_url: storefrontPreviewUrl || current.storefront_preview_url,
      ...rest,
    })
  }

  /** @deprecated Use retrieveSettingsForTenant */
  async retrieveSettings() {
    const [existing] = await this.listStorefrontThemes({}, { take: 1 })

    if (existing) {
      return existing
    }

    return await this.createStorefrontThemes(DEFAULT_STOREFRONT_THEME)
  }

  /** @deprecated Use updateSettingsForTenant */
  async updateSettings(data: Record<string, unknown>) {
    const current = await this.retrieveSettings()

    return await this.updateStorefrontThemes({
      id: current.id,
      ...data,
    })
  }
}

export default StorefrontThemeModuleService
