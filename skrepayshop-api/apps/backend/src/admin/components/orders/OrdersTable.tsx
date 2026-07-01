import {
  customerEmail,
  customerInitials,
  customerLabel,
  formatOrderMoney,
  formatRelativeDate,
  fulfillmentStatusLabel,
  itemCount,
  paymentStatusLabel,
  type OrderSummary,
} from "../../lib/orders-api"
import { skrepayColors, skrepayRadius } from "../../lib/skrepay-theme"
import {
  fulfillmentTone,
  OrdersStatusChip,
  paymentTone,
} from "./OrdersStatusChip"
import { OrdersPanel } from "./OrdersShell"

export function OrdersTable({
  orders,
  bare = false,
}: {
  orders: OrderSummary[]
  bare?: boolean
}) {
  const table = (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead>
            <tr
              style={{
                borderBottom: `1px solid ${skrepayColors.border}`,
                color: skrepayColors.textMuted,
              }}
            >
              <th className="px-4 py-3 font-medium">Pedido</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Canal</th>
              <th className="px-4 py-3 font-medium">Pago</th>
              <th className="px-4 py-3 font-medium">Cumplimiento</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const count = itemCount(order)
              return (
                <tr
                  key={order.id}
                  className="transition-colors"
                  style={{ borderBottom: `1px solid ${skrepayColors.border}` }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.background = skrepayColors.accentMuted
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.background = "transparent"
                  }}
                >
                  <td className="px-4 py-4">
                    <a
                      href={`/app/orders/${order.id}`}
                      className="block font-semibold"
                      style={{ color: skrepayColors.text }}
                    >
                      #{order.display_id}
                    </a>
                    <span
                      className="text-xs"
                      style={{ color: skrepayColors.textMuted }}
                    >
                      {count > 0 ? `${count} artículo${count === 1 ? "" : "s"}` : "—"}
                    </span>
                  </td>
                  <td
                    className="px-4 py-4 text-sm"
                    style={{ color: skrepayColors.textMuted }}
                  >
                    {formatRelativeDate(order.created_at)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center text-xs font-semibold"
                        style={{
                          background: skrepayColors.accentMuted,
                          border: `1px solid ${skrepayColors.borderStrong}`,
                          borderRadius: skrepayRadius.sm,
                          color: skrepayColors.accent,
                        }}
                      >
                        {customerInitials(order)}
                      </div>
                      <div className="min-w-0">
                        <div
                          className="truncate font-medium"
                          style={{ color: skrepayColors.text }}
                        >
                          {customerLabel(order)}
                        </div>
                        <div
                          className="truncate text-xs"
                          style={{ color: skrepayColors.textMuted }}
                        >
                          {customerEmail(order)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td
                    className="px-4 py-4"
                    style={{ color: skrepayColors.textMuted }}
                  >
                    {order.sales_channel?.name ?? "—"}
                  </td>
                  <td className="px-4 py-4">
                    <OrdersStatusChip
                      label={paymentStatusLabel(order.payment_status)}
                      tone={paymentTone(order.payment_status)}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <OrdersStatusChip
                      label={fulfillmentStatusLabel(order.fulfillment_status)}
                      tone={fulfillmentTone(order.fulfillment_status)}
                    />
                  </td>
                  <td
                    className="px-4 py-4 text-right font-semibold"
                    style={{ color: skrepayColors.text }}
                  >
                    {formatOrderMoney(order.total ?? 0, order.currency_code)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
  )

  if (bare) {
    return table
  }

  return <OrdersPanel>{table}</OrdersPanel>
}
