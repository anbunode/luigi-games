import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { isNativeMedusaAdminUiEnabled } from "../lib/native-admin-ui"

/** Disabled while USE_NATIVE_MEDUSA_ADMIN_UI restores default Medusa settings chrome. */
const SettingsSidebarShopify = () => {
  if (isNativeMedusaAdminUiEnabled()) {
    return null
  }

  return null
}

export const config = defineWidgetConfig({
  zone: [
    "store.details.before",
    "store.details.after",
    "user.list.before",
    "region.list.before",
    "tax.list.before",
    "location.list.before",
    "sales_channel.list.before",
    "product_type.list.before",
    "product_tag.list.before",
    "return_reason.list.before",
    "refund_reason.list.before",
    "api_key.list.before",
    "workflow.list.before",
    "order.list.before",
    "product.list.before",
    "login.before",
  ],
})

export default SettingsSidebarShopify
