import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useQueryClient } from "@tanstack/react-query"
import { useLayoutEffect } from "react"
import { installAuthBridge } from "../lib/auth-bridge"
import {
  activateRegionFormCurrencyOverlay,
  deactivateRegionFormCurrencyOverlay,
  isStoreQueryKey,
} from "../lib/region-form-currency-overlay"
import {
  isRegionFormPage,
  SKREPAY_ROUTE_CHANGE_EVENT,
} from "../lib/region-routes"

/**
 * Solo crear/editar región: inyecta el catálogo completo en el selector de moneda.
 * No toca /admin/stores; al salir restaura la caché original de la tienda.
 */
const RegionFormCurrencies = () => {
  const queryClient = useQueryClient()

  useLayoutEffect(() => {
    installAuthBridge()

    const sync = () => {
      if (isRegionFormPage(window.location.pathname)) {
        void queryClient.invalidateQueries({
          predicate: (query) => isStoreQueryKey(query.queryKey),
        })
        void activateRegionFormCurrencyOverlay(queryClient)
        return
      }

      deactivateRegionFormCurrencyOverlay(queryClient)
    }

    sync()
    window.addEventListener(SKREPAY_ROUTE_CHANGE_EVENT, sync)
    window.addEventListener("popstate", sync)

    return () => {
      window.removeEventListener(SKREPAY_ROUTE_CHANGE_EVENT, sync)
      window.removeEventListener("popstate", sync)
      if (!isRegionFormPage(window.location.pathname)) {
        deactivateRegionFormCurrencyOverlay(queryClient)
      }
    }
  }, [queryClient])

  return null
}

export const config = defineWidgetConfig({
  zone: [
    "region.details.before",
    "region.details.after",
    "region.list.before",
    "order.list.before",
    "product.list.before",
    "store.details.before",
  ],
})

export default RegionFormCurrencies
