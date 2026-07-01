import type { CSSProperties } from "react"
import { skrepayColors, skrepayRadius } from "../../lib/skrepay-theme"
import { OrdersPanel } from "./OrdersShell"

type OrdersFiltersBarProps = {
  query: string
  paymentStatus: string
  fulfillmentStatus: string
  onQueryChange: (value: string) => void
  onPaymentStatusChange: (value: string) => void
  onFulfillmentStatusChange: (value: string) => void
}

const selectStyle: CSSProperties = {
  background: skrepayColors.surface,
  border: `1px solid ${skrepayColors.border}`,
  borderRadius: skrepayRadius.sm,
  color: skrepayColors.text,
  padding: "10px 12px",
  fontSize: "13px",
  minWidth: "160px",
}

export function OrdersFiltersBar({
  query,
  paymentStatus,
  fulfillmentStatus,
  onQueryChange,
  onPaymentStatusChange,
  onFulfillmentStatusChange,
}: OrdersFiltersBarProps) {
  return (
    <OrdersPanel className="p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm"
            style={{ color: skrepayColors.textMuted }}
          >
            ⌕
          </span>
          <input
            type="search"
            value={query}
            placeholder="Buscar por cliente, nº pedido..."
            onChange={(event) => onQueryChange(event.target.value)}
            className="w-full py-2.5 pl-9 pr-3 text-sm outline-none"
            style={{
              background: skrepayColors.surface,
              border: `1px solid ${skrepayColors.border}`,
              borderRadius: skrepayRadius.sm,
              color: skrepayColors.text,
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={paymentStatus}
            onChange={(event) => onPaymentStatusChange(event.target.value)}
            style={selectStyle}
          >
            <option value="all">Todos los pagos</option>
            <option value="captured">Capturado</option>
            <option value="not_paid">No pagado</option>
            <option value="awaiting">Pendiente</option>
            <option value="refunded">Reembolsado</option>
          </select>
          <select
            value={fulfillmentStatus}
            onChange={(event) => onFulfillmentStatusChange(event.target.value)}
            style={selectStyle}
          >
            <option value="all">Todos los estados</option>
            <option value="fulfilled">Cumplido</option>
            <option value="not_fulfilled">No cumplido</option>
            <option value="partially_fulfilled">Parcial</option>
          </select>
        </div>
      </div>
    </OrdersPanel>
  )
}
