import {
  computeOrderKpis,
  formatOrderMoney,
  type OrderSummary,
} from "../../lib/orders-api"
import { skrepayColors, skrepayRadius } from "../../lib/skrepay-theme"
import { OrdersPanel } from "./OrdersShell"

function MiniSparkline({ values }: { values: number[] }) {
  if (values.length < 2) {
    return <svg width="72" height="28" aria-hidden />
  }

  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 72
      const y = 26 - ((value - min) / range) * 22
      return `${x},${y}`
    })
    .join(" ")

  return (
    <svg width="72" height="28" viewBox="0 0 72 28" aria-hidden>
      <polyline
        fill="none"
        stroke={skrepayColors.accent}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        opacity="0.85"
      />
    </svg>
  )
}

function KpiCard({
  label,
  value,
  hint,
  icon,
  spark,
}: {
  label: string
  value: string
  hint?: string
  icon: React.ReactNode
  spark: number[]
}) {
  return (
    <OrdersPanel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center"
            style={{
              background: skrepayColors.accentMuted,
              border: `1px solid ${skrepayColors.borderStrong}`,
              borderRadius: skrepayRadius.sm,
              color: skrepayColors.accent,
            }}
          >
            {icon}
          </div>
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: skrepayColors.textMuted }}
            >
              {label}
            </p>
            <p
              className="mt-1 text-2xl font-semibold tracking-tight"
              style={{ color: skrepayColors.text }}
            >
              {value}
            </p>
            {hint ? (
              <p className="mt-1 text-xs" style={{ color: skrepayColors.accentSoft }}>
                {hint}
              </p>
            ) : null}
          </div>
        </div>
        <MiniSparkline values={spark} />
      </div>
    </OrdersPanel>
  )
}

function buildSparkline(orders: OrderSummary[], pick: (o: OrderSummary) => number) {
  const sorted = [...orders].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  const slice = sorted.slice(-8)
  return slice.map(pick)
}

export function OrdersKpiCards({
  orders,
  totalCount,
}: {
  orders: OrderSummary[]
  totalCount?: number
}) {
  const kpis = computeOrderKpis(orders, totalCount)
  const revenueLabel = formatOrderMoney(kpis.totalRevenue, kpis.primaryCurrency)

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Total pedidos"
        value={String(kpis.totalOrders)}
        hint={totalCount !== undefined ? "En catálogo" : "En esta vista"}
        icon={<span className="text-xs font-bold">#</span>}
        spark={buildSparkline(orders, () => 1)}
      />
      <KpiCard
        label="Ingresos"
        value={revenueLabel}
        hint="Suma visible"
        icon={<span className="text-sm font-semibold">€</span>}
        spark={buildSparkline(orders, (o) => o.total ?? 0)}
      />
      <KpiCard
        label="Pendientes"
        value={String(kpis.pendingCount)}
        hint="Requieren atención"
        icon={<span className="text-xs font-bold">!</span>}
        spark={buildSparkline(orders, (o) =>
          o.payment_status === "not_paid" || o.fulfillment_status === "not_fulfilled"
            ? 1
            : 0
        )}
      />
      <KpiCard
        label="Cumplidos"
        value={String(kpis.fulfilledCount)}
        hint="En esta vista"
        icon={<span className="text-xs font-bold">✓</span>}
        spark={buildSparkline(orders, (o) =>
          o.fulfillment_status === "fulfilled" ? 1 : 0
        )}
      />
    </div>
  )
}
