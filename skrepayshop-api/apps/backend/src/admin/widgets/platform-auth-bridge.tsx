import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useQueryClient } from "@tanstack/react-query"
import { useLayoutEffect } from "react"
import { useTranslation } from "react-i18next"
import { installAuthBridge } from "../lib/auth-bridge"
import { registerProductPricingQueryClient } from "../lib/product-pricing-bridge"
import { applySkrepayDefaultLocale } from "../lib/default-locale"

const PlatformAuthBridge = () => {
  const { i18n } = useTranslation()
  const queryClient = useQueryClient()

  useLayoutEffect(() => {
    installAuthBridge()
    applySkrepayDefaultLocale(i18n)
    registerProductPricingQueryClient(queryClient)
  }, [i18n, queryClient])

  return null
}

export const config = defineWidgetConfig({
  zone: [
    "order.list.before",
    "product.list.before",
    "login.before",
  ],
})

export default PlatformAuthBridge
