import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useQueryClient } from "@tanstack/react-query"
import { useLayoutEffect } from "react"
import { installAuthBridge } from "../lib/auth-bridge"
import {
  activateProductPricingCurrencyOverlay,
  applyProductPricingUi,
  deactivateProductPricingCurrencyOverlay,
  getProductPricingDefaultCurrencyCode,
} from "../lib/product-pricing-currency-overlay"
import {
  isProductPricingPage,
  SKREPAY_ROUTE_CHANGE_EVENT,
} from "../lib/region-routes"

/**
 * Precios de producto: moneda base (tienda) + columnas por región.
 * Oculta el resto de monedas de tienda que duplican regiones.
 */
const ProductPricingCurrencies = () => {
  const queryClient = useQueryClient()

  useLayoutEffect(() => {
    installAuthBridge()

    const sync = () => {
      if (isProductPricingPage(window.location.pathname)) {
        void activateProductPricingCurrencyOverlay(queryClient)
        return
      }

      deactivateProductPricingCurrencyOverlay(queryClient)
    }

    const onDomChange = () => {
      if (!isProductPricingPage(window.location.pathname)) {
        return
      }

      applyProductPricingUi(getProductPricingDefaultCurrencyCode())
    }

    sync()
    window.addEventListener(SKREPAY_ROUTE_CHANGE_EVENT, sync)
    window.addEventListener("popstate", sync)

    const observer = new MutationObserver(onDomChange)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
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
