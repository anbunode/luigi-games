import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { isNativeMedusaAdminUiEnabled } from "../lib/native-admin-ui"

/** Disabled while USE_NATIVE_MEDUSA_ADMIN_UI restores native store settings sections. */
const HideStoreSections = () => {
  if (isNativeMedusaAdminUiEnabled()) {
    return null
  }

  return null
}

export const config = defineWidgetConfig({
  zone: ["store.details.before", "store.details.after"],
})

export default HideStoreSections
