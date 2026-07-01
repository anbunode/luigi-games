import { useQuery } from "@tanstack/react-query"
import { useEffect, useLayoutEffect, useMemo, useState } from "react"
import { OrdersFiltersBar } from "./OrdersFiltersBar"
import { OrdersKpiCards } from "./OrdersKpiCards"
import { OrdersShell } from "./OrdersShell"
import { OrdersTable } from "./OrdersTable"
import {
  computeOrderKpis,
  fetchOrders,
  formatOrderMoney,
} from "../../lib/orders-api"
import { installAuthBridge } from "../../lib/auth-bridge"
import {
  enableSkrepayTheme,
  skrepayColors,
  skrepayRadius,
  skrepayThemeCss,
} from "../../lib/skrepay-theme"

function SkrepayButton({
  children,
  variant = "primary",
  href,
  onClick,
}: {
  children: React.ReactNode
  variant?: "primary" | "ghost"
  href?: string
  onClick?: () => void
}) {
  const base: React.CSSProperties = {
    borderRadius: skrepayRadius.sm,
    padding: "10px 14px",
    fontSize: "13px",
    fontWeight: 600,
    lineHeight: 1,
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    textDecoration: "none",
    cursor: "pointer",
    border: "1px solid transparent",
  }

  const styles: React.CSSProperties =
    variant === "primary"
      ? {
          ...base,
          background: `linear-gradient(180deg, ${skrepayColors.accent} 0%, ${skrepayColors.accentStrong} 100%)`,
          color: "#0f1410",
          boxShadow: `0 0 0 1px ${skrepayColors.accentGlow}`,
        }
      : {
          ...base,
          background: skrepayColors.surface,
          color: skrepayColors.text,
          borderColor: skrepayColors.border,
        }

  if (href) {
    return (
      <a href={href} style={styles}>
        {children}
      </a>
    )
  }

  return (
    <button type="button" onClick={onClick} style={styles}>
      {children}
    </button>
  )
}

export function OrdersListPage() {
  useLayoutEffect(() => {
    installAuthBridge()
    enableSkrepayTheme()
  }, [])

  const [query, setQuery] = useState("")
  const [paymentStatus, setPaymentStatus] = useState("all")
  const [fulfillmentStatus, setFulfillmentStatus] = useState("all")
  const [debouncedQuery, setDebouncedQuery] = useState("")

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300)
    return () => window.clearTimeout(timer)
  }, [query])

  const ordersQuery = useQuery({
    queryKey: [
      "skrepay",
      "orders",
      "list",
      debouncedQuery,
      paymentStatus,
      fulfillmentStatus,
    ],
    queryFn: () =>
      fetchOrders({
        q: debouncedQuery || undefined,
        payment_status: paymentStatus,
        fulfillment_status: fulfillmentStatus,
        limit: 50,
      }),
    retry: 1,
  })

  const orders = ordersQuery.data?.orders ?? []
  const kpis = useMemo(() => computeOrderKpis(orders), [orders])
  const subtitle = `${kpis.totalOrders} pedidos en vista · ${formatOrderMoney(
    kpis.totalRevenue,
    kpis.primaryCurrency
  )} en total`

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
        <OrdersKpiCards orders={orders} />
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
          <OrdersTable orders={orders} />
        )}
      </OrdersShell>
    </>
  )
}

export default OrdersListPage
