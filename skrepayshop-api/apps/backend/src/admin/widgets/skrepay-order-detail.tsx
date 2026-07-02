import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useLayoutEffect } from "react"
import { useParams } from "react-router-dom"
import { OrdersDetailChrome } from "../components/orders/OrdersDetailChrome"
import { showOrdersLoadingOverlayIfNeeded } from "../lib/orders-loading-overlay"
import { installOrdersUiBridge } from "../lib/orders-ui-bridge"

const SkrepayOrderDetailWidget = () => {
  const { id } = useParams()

  useLayoutEffect(() => {
    showOrdersLoadingOverlayIfNeeded()
    installOrdersUiBridge()
  }, [id])

  if (!id) {
    return null
  }

  return <OrdersDetailChrome orderId={id} />
}

export const config = defineWidgetConfig({
  zone: "order.details.before",
})

export default SkrepayOrderDetailWidget
