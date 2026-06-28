import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useQueryClient } from "@tanstack/react-query"
import { useLayoutEffect, useRef } from "react"
import {
  resolveStoreCurrencyScope,
  SKREPAY_ROUTE_CHANGE_EVENT,
  type StoreCurrencyScope,
} from "../lib/store-currency-scope"

/**
 * Al cambiar entre Tienda (catalog) y Regiones (catálogo completo),
 * invalida la caché de store para que el selector de moneda sea correcto.
 */
const RegionCurrencyScopeSync = () => {
  const queryClient = useQueryClient()
  const lastScopeRef = useRef<StoreCurrencyScope>(
    resolveStoreCurrencyScope(window.location.pathname)
  )

  useLayoutEffect(() => {
    const sync = () => {
      const scope = resolveStoreCurrencyScope(window.location.pathname)

      if (scope === lastScopeRef.current) {
        return
      }

      lastScopeRef.current = scope
      queryClient.invalidateQueries({ queryKey: ["store"] })
      queryClient.invalidateQueries({ queryKey: ["stores"] })
    }

    sync()
    window.addEventListener(SKREPAY_ROUTE_CHANGE_EVENT, sync)
    window.addEventListener("popstate", sync)

    return () => {
      window.removeEventListener(SKREPAY_ROUTE_CHANGE_EVENT, sync)
      window.removeEventListener("popstate", sync)
    }
  }, [queryClient])

  return null
}

export const config = defineWidgetConfig({
  zone: ["region.list.before", "region.details.before", "store.details.before"],
})

export default RegionCurrencyScopeSync
