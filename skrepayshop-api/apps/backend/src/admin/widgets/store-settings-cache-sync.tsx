import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useQueryClient } from "@tanstack/react-query"
import { useLayoutEffect } from "react"
import { SKREPAY_ROUTE_CHANGE_EVENT } from "../lib/store-currency-scope"

function isStoreSettingsPath(pathname: string) {
  return /\/settings\/store(\/|$)/.test(pathname)
}

/**
 * En Ajustes → Tienda fuerza datos frescos del API (sin caché de productos).
 */
const StoreSettingsCacheSync = () => {
  const queryClient = useQueryClient()

  useLayoutEffect(() => {
    const refreshStoreSettings = () => {
      if (!isStoreSettingsPath(window.location.pathname)) {
        return
      }

      queryClient.invalidateQueries({
        predicate: (query) => {
          if (!Array.isArray(query.queryKey)) {
            return false
          }

          const [root, resource] = query.queryKey

          return (
            (root === "admin" &&
              (resource === "store" || resource === "stores")) ||
            (root === "price_preferences" || resource === "price_preferences")
          )
        },
      })
    }

    refreshStoreSettings()

    const onRouteChange = () => {
      refreshStoreSettings()
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
  zone: ["store.details.before", "store.details.after"],
})

export default StoreSettingsCacheSync
