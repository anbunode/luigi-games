import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useQueryClient } from "@tanstack/react-query"
import { useLayoutEffect } from "react"
import { SKREPAY_ROUTE_CHANGE_EVENT } from "../lib/store-currency-scope"

const StoreCurrencyScopeSync = () => {
  const queryClient = useQueryClient()

  useLayoutEffect(() => {
    const invalidateStore = () => {
      queryClient.invalidateQueries({ queryKey: ["store"] })
    }

    window.addEventListener(SKREPAY_ROUTE_CHANGE_EVENT, invalidateStore)

    return () => {
      window.removeEventListener(SKREPAY_ROUTE_CHANGE_EVENT, invalidateStore)
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
