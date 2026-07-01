/** Entry estable para el patch del bundle order-list → UI Skrepay. */
import { OrdersListPage } from "../components/orders/OrdersListPage"

export const SKREPAY_ORDERS_LIST_ENTRY = "skrepay-orders-list-entry"

if (typeof window !== "undefined") {
  ;(window as Window & { __SKREPAY_ORDERS_ENTRY__?: string }).__SKREPAY_ORDERS_ENTRY__ =
    SKREPAY_ORDERS_LIST_ENTRY
}

export function Component() {
  return <OrdersListPage />
}

// Evita que el bundler elimine el export Component.
export const __skrepayOrdersListEntry = SKREPAY_ORDERS_LIST_ENTRY
