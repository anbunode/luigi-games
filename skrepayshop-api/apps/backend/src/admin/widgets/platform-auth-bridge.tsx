import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useLayoutEffect } from "react"
import { useTranslation } from "react-i18next"
import { installAuthBridge } from "../lib/auth-bridge"
import { applySkrepayDefaultLocale } from "../lib/default-locale"
import { installHideLegacyRegionsNav } from "../lib/hide-legacy-regions-nav"

const PlatformAuthBridge = () => {
  const { i18n } = useTranslation()

  useLayoutEffect(() => {
    installAuthBridge()
    applySkrepayDefaultLocale(i18n)
    installHideLegacyRegionsNav()
  }, [i18n])

  return null
}

export const config = defineWidgetConfig({
  zone: [
    "order.list.before",
    "product.list.before",
    "customer.list.before",
    "store.details.before",
    "promotion.list.before",
    "inventory_item.list.before",
    "login.before",
  ],
})

export default PlatformAuthBridge
