import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useLayoutEffect } from "react"
import { installAuthBridge } from "../lib/auth-bridge"

const PlatformAuthBridge = () => {
  useLayoutEffect(() => {
    installAuthBridge()
  }, [])

  return null
}

export const config = defineWidgetConfig({
  zone: [
    "order.list.before",
    "product.list.before",
    "customer.list.before",
    "store.details.before",
    "promotion.list.before",
    "inventory_item.list.before",
    "login.before",
  ],
})

export default PlatformAuthBridge
