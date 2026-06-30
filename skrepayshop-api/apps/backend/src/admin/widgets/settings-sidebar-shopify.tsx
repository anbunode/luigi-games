import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useLayoutEffect } from "react"
import { installSettingsSidebarBridge } from "../lib/settings-sidebar-bridge"
import { installSettingsShopifySkin } from "../lib/settings-shopify-skin"
import { settingsShopifySkinStyles } from "../lib/settings-shopify-skin-styles"

const SettingsShopifySkin = () => {
  useLayoutEffect(() => {
    installSettingsShopifySkin()
    installSettingsSidebarBridge()
  }, [])

  return <style>{settingsShopifySkinStyles}</style>
}

export const config = defineWidgetConfig({
  zone: [
    "store.details.before",
    "store.details.after",
    "user.list.before",
    "user.list.after",
    "region.list.before",
    "region.list.after",
    "region.details.before",
    "tax.list.before",
    "tax.list.after",
    "tax.details.before",
    "location.list.before",
    "sales_channel.list.before",
    "product_type.list.before",
    "product_tag.list.before",
    "return_reason.list.before",
    "refund_reason.list.before",
    "api_key.list.before",
    "workflow.list.before",
    "workflow.details.before",
    "order.list.before",
    "product.list.before",
    "login.before",
  ],
})

export default SettingsShopifySkin
