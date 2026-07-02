import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useLayoutEffect } from "react"
import { OrdersListChrome } from "../components/orders/OrdersListChrome"
import {
  showOrdersLoadingOverlay,
  showOrdersLoadingOverlayIfNeeded,
} from "../lib/orders-loading-overlay"
import { installOrdersUiBridge } from "../lib/orders-ui-bridge"

const SkrepayOrdersListWidget = () => {
  useLayoutEffect(() => {
    showOrdersLoadingOverlayIfNeeded()
    installOrdersUiBridge()
    showOrdersLoadingOverlay()
  }, [])

  return <OrdersListChrome />
}

export const config = defineWidgetConfig({
  zone: "order.list.before",
})

export default SkrepayOrdersListWidget
