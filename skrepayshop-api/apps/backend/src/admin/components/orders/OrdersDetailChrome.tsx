import { useQuery } from "@tanstack/react-query"
import { useLayoutEffect } from "react"
import {
  fetchOrder,
  formatOrderDate,
  fulfillmentStatusLabel,
  orderStatusLabel,
  paymentStatusLabel,
} from "../../lib/orders-api"
import { clickNativeOrderAction } from "../../lib/orders-ui-bridge"
import {
  enableSkrepayTheme,
  skrepayColors,
  skrepayThemeCss,
} from "../../lib/skrepay-theme"
import { OrdersShell } from "./OrdersShell"
import {
  fulfillmentTone,
  OrdersStatusChip,
  paymentTone,
} from "./OrdersStatusChip"
import { SkrepayButton } from "./OrdersUi"

type OrdersDetailChromeProps = {
  orderId: string
}

/**
 * Cascarón Skrepay sobre el detalle nativo de Medusa.
 * Las secciones (resumen, pago, cumplimiento…) siguen siendo nativas.
 */
export function OrdersDetailChrome({ orderId }: OrdersDetailChromeProps) {
  useLayoutEffect(() => {
    enableSkrepayTheme()
  }, [])

  const orderQuery = useQuery({
    queryKey: ["skrepay", "orders", "detail-chrome", orderId],
    queryFn: () => fetchOrder(orderId),
    retry: 1,
  })

  const order = orderQuery.data
  const subtitle = order
    ? `${formatOrderDate(order.created_at)}${order.sales_channel?.name ? ` · ${order.sales_channel.name}` : ""}`
    : "Cargando…"

  return (
    <>
      <style>{skrepayThemeCss()}</style>
      <OrdersShell
        title={order ? `Pedido #${order.display_id}` : "Pedido"}
        subtitle={subtitle}
        actions={
          <SkrepayButton variant="ghost" href="/app/orders">
            ← Volver a pedidos
          </SkrepayButton>
        }
      >
        <div data-skrepay-order-detail-shell>
          {order ? (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <OrdersStatusChip
                  label={orderStatusLabel(order.status)}
                  tone={order.status === "canceled" ? "danger" : "neutral"}
                />
                <OrdersStatusChip
                  label={paymentStatusLabel(order.payment_status)}
                  tone={paymentTone(order.payment_status)}
                />
                <OrdersStatusChip
                  label={fulfillmentStatusLabel(order.fulfillment_status)}
                  tone={fulfillmentTone(order.fulfillment_status)}
                />
              </div>

              <div className="mb-2 flex flex-wrap gap-2">
                {order.payment_status !== "captured" ? (
                  <SkrepayButton
                    onClick={() =>
                      clickNativeOrderAction(/captur|pago|mark as paid|registrar/i)
                    }
                  >
                    Registrar pago
                  </SkrepayButton>
                ) : null}
                {order.fulfillment_status !== "fulfilled" ? (
                  <SkrepayButton
                    variant="ghost"
                    href={`/app/orders/${orderId}/fulfillment`}
                  >
                    Cumplir pedido
                  </SkrepayButton>
                ) : null}
                {order.payment_status === "captured" ? (
                  <SkrepayButton
                    variant="ghost"
                    href={`/app/orders/${orderId}/refund`}
                  >
                    Reembolsar
                  </SkrepayButton>
                ) : null}
                <SkrepayButton
                  variant="ghost"
                  href={`/app/orders/${orderId}/returns`}
                >
                  Devolución
                </SkrepayButton>
                <SkrepayButton
                  variant="ghost"
                  href={`/app/orders/${orderId}/edits`}
                >
                  Editar pedido
                </SkrepayButton>
                {order.status !== "canceled" ? (
                  <SkrepayButton
                    variant="danger"
                    onClick={() =>
                      clickNativeOrderAction(/cancel/i)
                    }
                  >
                    Cancelar
                  </SkrepayButton>
                ) : null}
              </div>

              <p className="text-xs" style={{ color: skrepayColors.textMuted }}>
                Las tarjetas de abajo son Medusa (resumen, pago, envíos). Los
                botones abren los mismos flujos de fábrica.
              </p>
            </>
          ) : orderQuery.isError ? (
            <p className="text-sm" style={{ color: skrepayColors.danger }}>
              {(orderQuery.error as Error).message}
            </p>
          ) : (
            <p className="text-sm" style={{ color: skrepayColors.textMuted }}>
              Cargando cabecera…
            </p>
          )}
        </div>
      </OrdersShell>
    </>
  )
}

export default OrdersDetailChrome
