import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { isNativeMedusaAdminUiEnabled } from "../lib/native-admin-ui"

/** Disabled while USE_NATIVE_MEDUSA_ADMIN_UI restores default Medusa orders list. */
const SkrepayOrdersListWidget = () => {
  if (isNativeMedusaAdminUiEnabled()) {
    return null
  }

  return null
}

export const config = defineWidgetConfig({
  zone: "order.list.before",
})

export default SkrepayOrdersListWidget
