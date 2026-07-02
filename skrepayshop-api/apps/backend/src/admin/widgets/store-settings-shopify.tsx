import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { isNativeMedusaAdminUiEnabled } from "../lib/native-admin-ui"

/** Disabled while USE_NATIVE_MEDUSA_ADMIN_UI restores default Medusa store settings page. */
const StoreSettingsShopify = () => {
  if (isNativeMedusaAdminUiEnabled()) {
    return null
  }

  return null
}

export const config = defineWidgetConfig({
  zone: ["store.details.before"],
})

export default StoreSettingsShopify
