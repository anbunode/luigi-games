import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { isNativeMedusaAdminUiEnabled } from "../lib/native-admin-ui"

/** Disabled while USE_NATIVE_MEDUSA_ADMIN_UI restores native profile settings route. */
const HideProfileSettings = () => {
  if (isNativeMedusaAdminUiEnabled()) {
    return null
  }

  return null
}

export const config = defineWidgetConfig({
  zone: [
    "store.details.before",
    "order.list.before",
    "product.list.before",
    "region.list.before",
  ],
})

export default HideProfileSettings
