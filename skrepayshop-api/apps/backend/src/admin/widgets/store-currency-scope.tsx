import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useQueryClient } from "@tanstack/react-query"
import { useLayoutEffect, useRef } from "react"
import { applyProductPricingCurrenciesToCache } from "../lib/product-store-currencies"
import {
  isPricingContext,
  resolveStoreCurrencyMode,
  SKREPAY_ROUTE_CHANGE_EVENT,
  type StoreCurrencyMode,
} from "../lib/store-currency-scope"

/**
 * Al entrar en productos aplica moneda base + regiones en caché.
 * Al salir a tienda/regiones recarga el catálogo completo.
 */
const StoreCurrencyScopeSync = () => {
  const queryClient = useQueryClient()
  const lastModeRef = useRef<StoreCurrencyMode>(
    resolveStoreCurrencyMode(window.location.pathname)
  )

  useLayoutEffect(() => {
    const syncOnModeChange = async () => {
      const mode = resolveStoreCurrencyMode(window.location.pathname)

      if (mode === lastModeRef.current) {
        if (mode === "pricing") {
          await applyProductPricingCurrenciesToCache(queryClient)
        }
        return
      }

      lastModeRef.current = mode

      if (mode === "pricing") {
        await applyProductPricingCurrenciesToCache(queryClient)
        return
      }

      queryClient.invalidateQueries({ queryKey: ["store"] })
    }

    void syncOnModeChange()

    const onRouteChange = () => {
      void syncOnModeChange()
    }

    window.addEventListener(SKREPAY_ROUTE_CHANGE_EVENT, onRouteChange)
    window.addEventListener("popstate", onRouteChange)

    return () => {
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
    "region.list.before",
    "region.details.before",
    "store.details.before",
    "order.list.before",
  ],
})

export default StoreCurrencyScopeSync
