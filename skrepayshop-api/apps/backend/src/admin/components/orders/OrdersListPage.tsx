import { useQuery } from "@tanstack/react-query"
import { useEffect, useLayoutEffect, useMemo, useState } from "react"
import { OrdersFiltersBar } from "./OrdersFiltersBar"
import { OrdersKpiCards } from "./OrdersKpiCards"
import { OrdersShell } from "./OrdersShell"
import { OrdersTable } from "./OrdersTable"
import { OrderExportModal } from "./OrderExportModal"
import { OrdersPagination } from "./OrdersPagination"
import {
  computeOrderKpis,
  fetchOrders,
  formatOrderMoney,
} from "../../lib/orders-api"
import { installAuthBridge } from "../../lib/auth-bridge"
import {
  enableSkrepayTheme,
  skrepayColors,
  skrepayThemeCss,
} from "../../lib/skrepay-theme"
import { SkrepayButton } from "./OrdersUi"

const PAGE_SIZE = 20

export function OrdersListPage() {
  useLayoutEffect(() => {
    installAuthBridge()
    enableSkrepayTheme()
  }, [])

  const [query, setQuery] = useState("")
  const [paymentStatus, setPaymentStatus] = useState("all")
  const [fulfillmentStatus, setFulfillmentStatus] = useState("all")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [page, setPage] = useState(0)
  const [exportOpen, setExportOpen] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    setPage(0)
  }, [debouncedQuery, paymentStatus, fulfillmentStatus])

  const ordersQuery = useQuery({
    queryKey: [
      "skrepay",
      "orders",
      "list",
      debouncedQuery,
      paymentStatus,
      fulfillmentStatus,
      page,
    ],
    queryFn: () =>
      fetchOrders({
        q: debouncedQuery || undefined,
        payment_status: paymentStatus,
        fulfillment_status: fulfillmentStatus,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }),
    retry: 1,
  })

  const orders = ordersQuery.data?.orders ?? []
  const totalCount = ordersQuery.data?.count ?? 0
  const kpis = useMemo(
    () => computeOrderKpis(orders, totalCount),
    [orders, totalCount]
  )
  const subtitle = `${totalCount} pedidos · ${formatOrderMoney(
    kpis.totalRevenue,
    kpis.primaryCurrency
  )} en esta página`

  return (
    <>
      <style>{skrepayThemeCss()}</style>
      <OrdersShell
        title="Pedidos"
        subtitle={subtitle}
        actions={
          <>
            <SkrepayButton variant="ghost" onClick={() => setExportOpen(true)}>
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

        {ordersQuery.isLoading ? (
          <div
            className="px-4 py-10 text-sm"
            style={{ color: skrepayColors.textMuted }}
          >
            Cargando pedidos…
          </div>
        ) : ordersQuery.isError ? (
          <div className="px-4 py-10 text-sm" style={{ color: skrepayColors.danger }}>
            {(ordersQuery.error as Error)?.message ?? "No se pudieron cargar los pedidos."}
          </div>
        ) : orders.length === 0 ? (
          <div
            className="px-4 py-12 text-center"
            style={{ color: skrepayColors.textMuted }}
          >
            <p className="text-base font-medium" style={{ color: skrepayColors.text }}>
              No hay pedidos con estos filtros
            </p>
            <p className="mt-2 text-sm">Prueba otra búsqueda o crea un borrador.</p>
          </div>
        ) : (
          <>
            <OrdersPanel className="overflow-hidden p-0">
              <OrdersTable orders={orders} bare />
              <OrdersPagination
                page={page}
                pageSize={PAGE_SIZE}
                total={totalCount}
                onPageChange={setPage}
              />
            </OrdersPanel>
          </>
        )}
      </OrdersShell>

      <OrderExportModal open={exportOpen} onOpenChange={setExportOpen} />
    </>
  )
}

export default OrdersListPage
