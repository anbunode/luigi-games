import { useQuery } from "@tanstack/react-query"
import { useEffect, useLayoutEffect, useMemo, useState } from "react"
import { OrdersFiltersBar } from "./OrdersFiltersBar"
import { OrdersKpiCards } from "./OrdersKpiCards"
import { OrdersShell } from "./OrdersShell"
import {
  computeOrderKpis,
  fetchOrders,
  formatOrderMoney,
} from "../../lib/orders-api"
import {
  syncOrdersFulfillmentFilter,
  syncOrdersListFilters,
  syncOrdersPaymentFilter,
} from "../../lib/orders-ui-bridge"
import { scheduleHideOrdersLoadingOverlay } from "../../lib/orders-loading-overlay"
import {
  enableSkrepayTheme,
  skrepayThemeCss,
} from "../../lib/skrepay-theme"
import { SkrepayButton } from "./OrdersUi"

/**
 * Cascarón visual Skrepay sobre la lista nativa de Medusa.
 * La tabla, paginación y acciones siguen siendo las de fábrica.
 */
export function OrdersListChrome() {
  useLayoutEffect(() => {
    enableSkrepayTheme()
    scheduleHideOrdersLoadingOverlay()
  }, [])

  const [query, setQuery] = useState("")
  const [paymentStatus, setPaymentStatus] = useState("all")
  const [fulfillmentStatus, setFulfillmentStatus] = useState("all")

  const statsQuery = useQuery({
    queryKey: ["skrepay", "orders", "stats"],
    queryFn: () => fetchOrders({ limit: 50 }),
    retry: 1,
    staleTime: 30_000,
  })

  const orders = statsQuery.data?.orders ?? []
  const totalCount = statsQuery.data?.count ?? 0
  const kpis = useMemo(
    () => computeOrderKpis(orders, totalCount),
    [orders, totalCount]
  )

  useEffect(() => {
    syncOrdersListFilters(query)
  }, [query])

  useEffect(() => {
    syncOrdersPaymentFilter(paymentStatus)
  }, [paymentStatus])

  useEffect(() => {
    syncOrdersFulfillmentFilter(fulfillmentStatus)
  }, [fulfillmentStatus])

  const subtitle = `${totalCount} pedidos · ${formatOrderMoney(
    kpis.totalRevenue,
    kpis.primaryCurrency
  )} en vista reciente`

  return (
    <>
      <style>{skrepayThemeCss()}</style>
      <OrdersShell
        title="Pedidos"
        subtitle={subtitle}
        actions={
          <>
            <SkrepayButton variant="ghost" href="/app/orders/export">
              Exportar
            </SkrepayButton>
            <SkrepayButton variant="primary" href="/app/draft-orders/create">
              + Nuevo pedido
            </SkrepayButton>
          </>
        }
      >
        <OrdersKpiCards orders={orders} totalCount={totalCount} />
        <OrdersFiltersBar
          query={query}
          paymentStatus={paymentStatus}
          fulfillmentStatus={fulfillmentStatus}
          onQueryChange={setQuery}
          onPaymentStatusChange={setPaymentStatus}
          onFulfillmentStatusChange={setFulfillmentStatus}
        />
        <p
          className="text-xs"
          style={{ color: "rgba(255,255,255,0.45)", marginTop: "-0.5rem" }}
        >
          Los filtros de búsqueda se sincronizan con la tabla nativa de Medusa.
        </p>
      </OrdersShell>
    </>
  )
}

export default OrdersListChrome
