import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useQueryClient } from "@tanstack/react-query"
import { useLayoutEffect } from "react"
import {
  activateProductPricingCurrencyOverlay,
  deactivateProductPricingCurrencyOverlay,
} from "../lib/product-pricing-currency-overlay"
import {
  isProductPricingPage,
  SKREPAY_ROUTE_CHANGE_EVENT,
} from "../lib/region-routes"

/**
 * Precios de productos: una columna por moneda (base + regiones), sin columnas por región.
 */
const ProductPricingCurrencies = () => {
  const queryClient = useQueryClient()

  useLayoutEffect(() => {
    const sync = () => {
      if (isProductPricingPage(window.location.pathname)) {
        void activateProductPricingCurrencyOverlay(queryClient)
        return
      }

      deactivateProductPricingCurrencyOverlay(queryClient)
    }

    sync()
    window.addEventListener(SKREPAY_ROUTE_CHANGE_EVENT, sync)
    window.addEventListener("popstate", sync)

    return () => {
      window.removeEventListener(SKREPAY_ROUTE_CHANGE_EVENT, sync)
      window.removeEventListener("popstate", sync)
      deactivateProductPricingCurrencyOverlay(queryClient)
    }
  }, [queryClient])

  return null
}

export const config = defineWidgetConfig({
  zone: [
    "product.details.before",
    "product.details.after",
    "product.list.before",
    "order.list.before",
  ],
})

export default ProductPricingCurrencies
