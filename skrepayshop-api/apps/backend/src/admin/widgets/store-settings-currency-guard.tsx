import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useQueryClient } from "@tanstack/react-query"
import { useLayoutEffect } from "react"
import {
  deactivateRegionFormCurrencyOverlay,
  isRegionFormCurrencyOverlayActive,
} from "../lib/region-form-currency-overlay"
import {
  isStoreSettingsPage,
  SKREPAY_ROUTE_CHANGE_EVENT,
} from "../lib/region-routes"

/**
 * En Configuración → Tienda: garantiza que el overlay de regiones
 * no deje datos del catálogo completo en la sección de monedas.
 */
const StoreSettingsCurrencyGuard = () => {
  const queryClient = useQueryClient()

  useLayoutEffect(() => {
    const sync = () => {
      if (!isStoreSettingsPage(window.location.pathname)) {
        return
      }

      if (isRegionFormCurrencyOverlayActive()) {
        deactivateRegionFormCurrencyOverlay(queryClient)
      }
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
  zone: ["store.details.before", "store.details.after"],
})

export default StoreSettingsCurrencyGuard
