import { defineRouteConfig } from "@medusajs/admin-sdk"
import { DraftOrdersListPage } from "../../components/draft-orders/DraftOrdersListPage"

export const config = defineRouteConfig({
  label: "Borradores",
  nested: "/orders",
})

export default DraftOrdersListPage
