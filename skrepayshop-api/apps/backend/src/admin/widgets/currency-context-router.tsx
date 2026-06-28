import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useQueryClient } from "@tanstack/react-query"
import { useLayoutEffect } from "react"
import {
  activateRegionCurrencyOverlay,
  deactivateRegionCurrencyOverlay,
} from "../lib/region-currency-overlay"
import {
  isStoreSettingsPage,
  needsRegionCurrencyOverlay,
  SKREPAY_ROUTE_CHANGE_EVENT,
} from "../lib/store-currency-scope"

/**
 * Enruta el contexto de monedas según la pantalla:
 * - Tienda → solo monedas habilitadas (/admin/stores)
 * - Crear/editar región → catálogo completo (overlay aislado)
 */
const CurrencyContextRouter = () => {
  const queryClient = useQueryClient()

  useLayoutEffect(() => {
    const sync = () => {
      const path = window.location.pathname

      if (needsRegionCurrencyOverlay(path)) {
        void activateRegionCurrencyOverlay(queryClient)
        return
      }

      if (isStoreSettingsPage(path)) {
        void deactivateRegionCurrencyOverlay(queryClient, { refetchCatalog: true })
        return
      }

      void deactivateRegionCurrencyOverlay(queryClient)
    }

    sync()
    window.addEventListener(SKREPAY_ROUTE_CHANGE_EVENT, sync)
    window.addEventListener("popstate", sync)

    return () => {
      window.removeEventListener(SKREPAY_ROUTE_CHANGE_EVENT, sync)
      window.removeEventListener("popstate", sync)
      void deactivateRegionCurrencyOverlay(queryClient)
    }
  }, [queryClient])

  return null
}

export const config = defineWidgetConfig({
  zone: ["order.list.before", "product.list.before", "login.before"],
})

export default CurrencyContextRouter
