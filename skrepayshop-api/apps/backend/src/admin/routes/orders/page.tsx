import { defineRouteConfig } from "@medusajs/admin-sdk"
import { OrdersListPage } from "../../components/orders/OrdersListPage"

export const config = defineRouteConfig({
  label: "Pedidos",
})

export default OrdersListPage
