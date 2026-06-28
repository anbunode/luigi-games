import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useQueryClient } from "@tanstack/react-query"
import { useLayoutEffect, useRef } from "react"
import {
  resolveStoreCurrencyMode,
  SKREPAY_ROUTE_CHANGE_EVENT,
  type StoreCurrencyMode,
} from "../lib/store-currency-scope"

/**
 * Solo invalida la caché de tienda al cruzar el límite catálogo ↔ precios.
 * Navegar entre Tienda y Regiones NO debe recargar monedas (evita parpadeos).
 */
const StoreCurrencyScopeSync = () => {
  const queryClient = useQueryClient()
  const lastModeRef = useRef<StoreCurrencyMode>(
    resolveStoreCurrencyMode(window.location.pathname)
  )

  useLayoutEffect(() => {
    const syncOnModeChange = () => {
      const mode = resolveStoreCurrencyMode(window.location.pathname)

      if (mode === lastModeRef.current) {
        return
      }

      lastModeRef.current = mode
      queryClient.invalidateQueries({ queryKey: ["store"] })
    }

    syncOnModeChange()
    window.addEventListener(SKREPAY_ROUTE_CHANGE_EVENT, syncOnModeChange)
    window.addEventListener("popstate", syncOnModeChange)

    return () => {
      window.removeEventListener(SKREPAY_ROUTE_CHANGE_EVENT, syncOnModeChange)
      window.removeEventListener("popstate", syncOnModeChange)
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
