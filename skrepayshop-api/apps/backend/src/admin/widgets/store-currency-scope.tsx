import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useQueryClient } from "@tanstack/react-query"
import { useLayoutEffect } from "react"
import { useLocation } from "react-router-dom"
import { SKREPAY_ROUTE_CHANGE_EVENT } from "../lib/store-currency-scope"

const StoreCurrencyScopeSync = () => {
  const queryClient = useQueryClient()
  const location = useLocation()

  useLayoutEffect(() => {
    const invalidateStore = () => {
      queryClient.invalidateQueries({ queryKey: ["store"] })
    }

    invalidateStore()
    window.addEventListener(SKREPAY_ROUTE_CHANGE_EVENT, invalidateStore)

    return () => {
      window.removeEventListener(SKREPAY_ROUTE_CHANGE_EVENT, invalidateStore)
    }
  }, [location.pathname, queryClient])

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
