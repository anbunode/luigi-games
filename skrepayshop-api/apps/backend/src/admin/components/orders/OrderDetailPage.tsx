import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "@medusajs/ui"
import { useLayoutEffect, useState } from "react"
import {
  canCancelOrder,
  canFulfillOrder,
  canMarkAsPaid,
  cancelFulfillment,
  createFulfillmentShipment,
  fetchOrder,
  fetchOrderChanges,
  formatAddress,
  formatOrderDate,
  formatOrderMoney,
  fulfillmentStatusLabel,
  markFulfillmentDelivered,
  orderStatusLabel,
  paymentStatusLabel,
  type OrderDetail,
  type OrderFulfillment,
} from "../../lib/orders-api"
import { installAuthBridge } from "../../lib/auth-bridge"
import {
  enableSkrepayTheme,
  skrepayColors,
  skrepayRadius,
  skrepayThemeCss,
} from "../../lib/skrepay-theme"
import { OrderCancelModal } from "./OrderCancelModal"
import { OrderCaptureModal } from "./OrderCaptureModal"
import { OrderFulfillmentModal } from "./OrderFulfillmentModal"
import { OrderRefundModal } from "./OrderRefundModal"
import { OrdersShell } from "./OrdersShell"
import {
  fulfillmentTone,
  OrdersStatusChip,
  paymentTone,
} from "./OrdersStatusChip"
import {
  SkrepayButton,
  SkrepayFieldLabel,
  SkrepayModalBackdrop,
  SkrepayModalHeader,
  SkrepaySection,
  skrepayInputStyle,
} from "./OrdersUi"

type OrderDetailPageProps = {
  orderId: string
}

function ShipmentModal({
  open,
  orderId,
  fulfillment,
  onClose,
  onSuccess,
}: {
  open: boolean
  orderId: string
  fulfillment: OrderFulfillment | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [trackingNumber, setTrackingNumber] = useState("")
  const [trackingUrl, setTrackingUrl] = useState("")

  const shipmentMutation = useMutation({
    mutationFn: async () => {
      if (!fulfillment?.id) throw new Error("Cumplimiento no disponible")
      if (!trackingNumber.trim()) throw new Error("Indica un número de seguimiento")
      await createFulfillmentShipment(orderId, fulfillment.id, [
        {
          tracking_number: trackingNumber.trim(),
          tracking_url: trackingUrl.trim() || undefined,
        },
      ])
    },
    onSuccess: () => {
      toast.success("Envío registrado")
      onSuccess()
      onClose()
      setTrackingNumber("")
      setTrackingUrl("")
    },
  })

  return (
    <SkrepayModalBackdrop open={open} onClose={onClose}>
      <SkrepayModalHeader
        title="Registrar envío"
        subtitle="Añade el seguimiento del paquete."
        onClose={onClose}
      />
      <div className="space-y-4 px-5 py-5">
        <div>
          <SkrepayFieldLabel>Número de seguimiento</SkrepayFieldLabel>
          <input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            style={skrepayInputStyle()}
          />
        </div>
        <div>
          <SkrepayFieldLabel>URL de seguimiento (opcional)</SkrepayFieldLabel>
          <input
            value={trackingUrl}
            onChange={(e) => setTrackingUrl(e.target.value)}
            style={skrepayInputStyle()}
          />
        </div>
        {shipmentMutation.isError ? (
          <p className="text-sm" style={{ color: skrepayColors.danger }}>
            {(shipmentMutation.error as Error).message}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <SkrepayButton variant="ghost" onClick={onClose}>
            Cancelar
          </SkrepayButton>
          <SkrepayButton
            onClick={() => shipmentMutation.mutate()}
            disabled={shipmentMutation.isPending}
          >
            {shipmentMutation.isPending ? "Guardando…" : "Registrar envío"}
          </SkrepayButton>
        </div>
      </div>
    </SkrepayModalBackdrop>
  )
}

function OrderDetailContent({ order }: { order: OrderDetail }) {
  const queryClient = useQueryClient()
  const [captureOpen, setCaptureOpen] = useState(false)
  const [fulfillOpen, setFulfillOpen] = useState(false)
  const [refundOpen, setRefundOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [shipmentFulfillment, setShipmentFulfillment] =
    useState<OrderFulfillment | null>(null)

  const changesQuery = useQuery({
    queryKey: ["skrepay", "orders", "changes", order.id],
    queryFn: () => fetchOrderChanges(order.id),
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["skrepay", "orders"] })
  }

  const deliverMutation = useMutation({
    mutationFn: (fulfillmentId: string) =>
      markFulfillmentDelivered(order.id, fulfillmentId),
    onSuccess: () => {
      toast.success("Marcado como entregado")
      refresh()
    },
  })

  const cancelFulfillmentMutation = useMutation({
    mutationFn: (fulfillmentId: string) =>
      cancelFulfillment(order.id, fulfillmentId),
    onSuccess: () => {
      toast.success("Cumplimiento cancelado")
      refresh()
    },
  })

  const billingSameAsShipping =
    formatAddress(order.shipping_address) === formatAddress(order.billing_address)

  return (
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

      <div className="mb-5 flex flex-wrap gap-2">
        {canMarkAsPaid(order) ? (
          <SkrepayButton onClick={() => setCaptureOpen(true)}>
            Registrar pago
          </SkrepayButton>
        ) : null}
        {canFulfillOrder(order) ? (
          <SkrepayButton variant="ghost" onClick={() => setFulfillOpen(true)}>
            Cumplir pedido
          </SkrepayButton>
        ) : null}
        {order.payment_status === "captured" ? (
          <SkrepayButton variant="ghost" onClick={() => setRefundOpen(true)}>
            Reembolsar
          </SkrepayButton>
        ) : null}
        {canCancelOrder(order) ? (
          <SkrepayButton variant="danger" onClick={() => setCancelOpen(true)}>
            Cancelar pedido
          </SkrepayButton>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-4">
          <SkrepaySection title="Resumen">
            <div className="divide-y" style={{ borderColor: skrepayColors.border }}>
              {(order.items ?? []).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium" style={{ color: skrepayColors.text }}>
                      {item.title}
                    </p>
                    <p className="text-xs" style={{ color: skrepayColors.textMuted }}>
                      {formatOrderMoney(item.unit_price, order.currency_code)} ·{" "}
                      {item.quantity}x
                    </p>
                  </div>
                  <p className="font-semibold" style={{ color: skrepayColors.text }}>
                    {formatOrderMoney(
                      item.total ?? item.unit_price * item.quantity,
                      order.currency_code
                    )}
                  </p>
                </div>
              ))}
            </div>
            <div
              className="space-y-2 px-5 py-4 text-sm"
              style={{ borderTop: `1px solid ${skrepayColors.border}` }}
            >
              <div className="flex justify-between" style={{ color: skrepayColors.textMuted }}>
                <span>Subtotal</span>
                <span>{formatOrderMoney(order.subtotal ?? 0, order.currency_code)}</span>
              </div>
              <div className="flex justify-between" style={{ color: skrepayColors.textMuted }}>
                <span>Envío</span>
                <span>{formatOrderMoney(order.shipping_total ?? 0, order.currency_code)}</span>
              </div>
              <div className="flex justify-between" style={{ color: skrepayColors.textMuted }}>
                <span>Impuestos</span>
                <span>{formatOrderMoney(order.tax_total ?? 0, order.currency_code)}</span>
              </div>
              <div
                className="flex justify-between pt-2 text-base font-semibold"
                style={{
                  color: skrepayColors.text,
                  borderTop: `1px solid ${skrepayColors.border}`,
                }}
              >
                <span>Total</span>
                <span>{formatOrderMoney(order.total ?? 0, order.currency_code)}</span>
              </div>
            </div>
          </SkrepaySection>

          <SkrepaySection title="Cumplimientos">
            {(order.fulfillments ?? []).length === 0 ? (
              <p className="px-5 py-6 text-sm" style={{ color: skrepayColors.textMuted }}>
                Aún no hay cumplimientos para este pedido.
              </p>
            ) : (
              <div className="divide-y" style={{ borderColor: skrepayColors.border }}>
                {(order.fulfillments ?? []).map((fulfillment) => (
                  <div key={fulfillment.id} className="space-y-3 px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium" style={{ color: skrepayColors.text }}>
                          {fulfillment.id.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-xs" style={{ color: skrepayColors.textMuted }}>
                          {fulfillment.created_at
                            ? formatOrderDate(fulfillment.created_at)
                            : "—"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {!fulfillment.shipped_at && !fulfillment.canceled_at ? (
                          <SkrepayButton
                            variant="ghost"
                            onClick={() => setShipmentFulfillment(fulfillment)}
                          >
                            Registrar envío
                          </SkrepayButton>
                        ) : null}
                        {fulfillment.shipped_at && !fulfillment.delivered_at ? (
                          <SkrepayButton
                            variant="ghost"
                            disabled={deliverMutation.isPending}
                            onClick={() => deliverMutation.mutate(fulfillment.id)}
                          >
                            Marcar entregado
                          </SkrepayButton>
                        ) : null}
                        {!fulfillment.canceled_at && !fulfillment.delivered_at ? (
                          <SkrepayButton
                            variant="danger"
                            disabled={cancelFulfillmentMutation.isPending}
                            onClick={() =>
                              cancelFulfillmentMutation.mutate(fulfillment.id)
                            }
                          >
                            Cancelar
                          </SkrepayButton>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-xs" style={{ color: skrepayColors.textMuted }}>
                      {(fulfillment.items ?? []).map((item) => (
                        <div key={item.id}>
                          {item.title ?? "Artículo"} · {item.quantity ?? 0}x
                        </div>
                      ))}
                      {fulfillment.labels?.[0]?.tracking_number ? (
                        <div className="mt-2">
                          Seguimiento: {fulfillment.labels[0].tracking_number}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SkrepaySection>

          <SkrepaySection title="Actividad">
            {(changesQuery.data ?? []).length === 0 ? (
              <p className="px-5 py-6 text-sm" style={{ color: skrepayColors.textMuted }}>
                Sin cambios registrados.
              </p>
            ) : (
              <div className="divide-y" style={{ borderColor: skrepayColors.border }}>
                {(changesQuery.data ?? []).map((change) => (
                  <div key={change.id} className="px-5 py-3">
                    <p className="text-sm" style={{ color: skrepayColors.text }}>
                      {change.action ?? change.description ?? "Cambio"}
                    </p>
                    {change.created_at ? (
                      <p className="text-xs" style={{ color: skrepayColors.textMuted }}>
                        {formatOrderDate(change.created_at)}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </SkrepaySection>
        </div>

        <div className="flex flex-col gap-4">
          <SkrepaySection title="Cliente">
            <div className="space-y-1 px-5 py-4 text-sm">
              <p style={{ color: skrepayColors.text }}>
                {order.customer?.first_name || order.customer?.last_name
                  ? `${order.customer?.first_name ?? ""} ${order.customer?.last_name ?? ""}`.trim()
                  : "Cliente invitado"}
              </p>
              <p style={{ color: skrepayColors.textMuted }}>
                {order.customer?.email ?? order.email ?? "—"}
              </p>
            </div>
          </SkrepaySection>

          <SkrepaySection title="Envío">
            <pre
              className="whitespace-pre-wrap px-5 py-4 text-sm"
              style={{ color: skrepayColors.textMuted, fontFamily: "inherit" }}
            >
              {formatAddress(order.shipping_address)}
            </pre>
          </SkrepaySection>

          <SkrepaySection title="Facturación">
            <pre
              className="whitespace-pre-wrap px-5 py-4 text-sm"
              style={{ color: skrepayColors.textMuted, fontFamily: "inherit" }}
            >
              {billingSameAsShipping
                ? "Igual que la dirección de envío"
                : formatAddress(order.billing_address)}
            </pre>
          </SkrepaySection>

          <SkrepaySection title="Pago">
            <div className="space-y-2 px-5 py-4 text-sm">
              <div className="flex justify-between">
                <span style={{ color: skrepayColors.textMuted }}>Estado</span>
                <OrdersStatusChip
                  label={paymentStatusLabel(order.payment_status)}
                  tone={paymentTone(order.payment_status)}
                />
              </div>
              <div className="flex justify-between" style={{ color: skrepayColors.textMuted }}>
                <span>Total</span>
                <span>{formatOrderMoney(order.total ?? 0, order.currency_code)}</span>
              </div>
              {order.payment_collections?.[0]?.id ? (
                <p className="text-xs" style={{ color: skrepayColors.textMuted }}>
                  Colección: {order.payment_collections[0].id.slice(-10)}
                </p>
              ) : null}
            </div>
          </SkrepaySection>

          <SkrepaySection title="Canal y región">
            <div className="space-y-2 px-5 py-4 text-sm" style={{ color: skrepayColors.textMuted }}>
              <p>Canal: {order.sales_channel?.name ?? "—"}</p>
              <p>Región: {order.region?.name ?? "—"}</p>
            </div>
          </SkrepaySection>
        </div>
      </div>

      <OrderCaptureModal
        open={captureOpen}
        order={order}
        onOpenChange={setCaptureOpen}
        onSuccess={refresh}
      />
      <OrderFulfillmentModal
        open={fulfillOpen}
        order={order}
        onOpenChange={setFulfillOpen}
        onSuccess={refresh}
      />
      <OrderRefundModal
        open={refundOpen}
        order={order}
        onOpenChange={setRefundOpen}
        onSuccess={refresh}
      />
      <OrderCancelModal
        open={cancelOpen}
        orderId={order.id}
        displayId={order.display_id}
        onOpenChange={setCancelOpen}
        onCanceled={refresh}
      />
      <ShipmentModal
        open={Boolean(shipmentFulfillment)}
        orderId={order.id}
        fulfillment={shipmentFulfillment}
        onClose={() => setShipmentFulfillment(null)}
        onSuccess={refresh}
      />
    </>
  )
}

export function OrderDetailPage({ orderId }: OrderDetailPageProps) {
  useLayoutEffect(() => {
    installAuthBridge()
    enableSkrepayTheme()
  }, [])

  const orderQuery = useQuery({
    queryKey: ["skrepay", "orders", "detail", orderId],
    queryFn: () => fetchOrder(orderId),
    retry: 1,
  })

  const order = orderQuery.data
  const subtitle = order
    ? `${formatOrderDate(order.created_at)}${order.sales_channel?.name ? ` · ${order.sales_channel.name}` : ""}`
    : "Cargando pedido…"

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
          {orderQuery.isLoading ? (
            <p className="text-sm" style={{ color: skrepayColors.textMuted }}>
              Cargando pedido…
            </p>
          ) : orderQuery.isError || !order ? (
            <p className="text-sm" style={{ color: skrepayColors.danger }}>
              {(orderQuery.error as Error)?.message ?? "No se pudo cargar el pedido."}
            </p>
          ) : (
            <OrderDetailContent order={order} />
          )}
        </div>
      </OrdersShell>
    </>
  )
}

export default OrderDetailPage
