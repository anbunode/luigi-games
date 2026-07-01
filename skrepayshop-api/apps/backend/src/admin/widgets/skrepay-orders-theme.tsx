import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useLayoutEffect } from "react"
import { enableSkrepayTheme, skrepayThemeCss } from "../lib/skrepay-theme"

const OrdersThemeWidget = () => {
  useLayoutEffect(() => {
    enableSkrepayTheme()
  }, [])

  return <style>{skrepayThemeCss()}</style>
}

export const config = defineWidgetConfig({
  zone: "order.list.before",
})

export default OrdersThemeWidget
