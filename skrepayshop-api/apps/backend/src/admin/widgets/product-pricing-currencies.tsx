import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useQueryClient } from "@tanstack/react-query"
import { useLayoutEffect } from "react"
import { applyProductPricingCurrenciesToCache } from "../lib/product-store-currencies"
import {
  isPricingContext,
  SKREPAY_ROUTE_CHANGE_EVENT,
} from "../lib/store-currency-scope"

/**
 * En pantallas de producto fuerza supported_currencies = moneda base + regiones.
 * Evita que la grilla lea las 124 monedas del catálogo de tienda.
 */
const ProductPricingCurrencies = () => {
  const queryClient = useQueryClient()

  useLayoutEffect(() => {
    let cancelled = false

    const applyIfPricing = () => {
      if (!isPricingContext(window.location.pathname)) {
        return
      }

      applyProductPricingCurrenciesToCache(queryClient).catch(() => undefined)
    }

    applyIfPricing()

    const onRouteChange = () => {
      if (cancelled) {
        return
      }
      applyIfPricing()
    }

    const observer = new MutationObserver(() => {
      if (cancelled || !isPricingContext(window.location.pathname)) {
        return
      }
      applyIfPricing()
    })

    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener(SKREPAY_ROUTE_CHANGE_EVENT, onRouteChange)
    window.addEventListener("popstate", onRouteChange)

    return () => {
      cancelled = true
      observer.disconnect()
      window.removeEventListener(SKREPAY_ROUTE_CHANGE_EVENT, onRouteChange)
      window.removeEventListener("popstate", onRouteChange)
    }
  }, [queryClient])

  return null
}

export const config = defineWidgetConfig({
  zone: [
    "product.list.before",
    "product.details.before",
    "product.details.after",
    "product_variant.list.before",
    "product_variant.details.before",
  ],
})

export default ProductPricingCurrencies
