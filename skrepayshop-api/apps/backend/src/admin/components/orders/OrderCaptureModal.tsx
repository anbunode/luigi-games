import { useMutation } from "@tanstack/react-query"
import { toast } from "@medusajs/ui"
import {
  capturePayment,
  getCapturablePayment,
  getPrimaryPaymentCollection,
  markOrderPaymentAsPaid,
  type OrderDetail,
} from "../../lib/orders-api"
import { skrepayColors } from "../../lib/skrepay-theme"
import {
  SkrepayButton,
  SkrepayModalBackdrop,
  SkrepayModalHeader,
} from "./OrdersUi"

type OrderCaptureModalProps = {
  open: boolean
  order: OrderDetail | null
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function OrderCaptureModal({
  open,
  order,
  onOpenChange,
  onSuccess,
}: OrderCaptureModalProps) {
  const payment = order ? getCapturablePayment(order) : null
  const collection = order ? getPrimaryPaymentCollection(order) : null

  const captureMutation = useMutation({
    mutationFn: async () => {
      if (!order) throw new Error("Pedido no disponible")
      if (payment?.id) {
        await capturePayment(payment.id)
        return
      }
      if (collection?.id) {
        await markOrderPaymentAsPaid(collection.id, order.id)
        return
      }
      throw new Error("No hay pago disponible para capturar")
    },
    onSuccess: () => {
      toast.success("Pago registrado")
      onSuccess()
      onOpenChange(false)
    },
  })

  const close = () => {
    if (!captureMutation.isPending) onOpenChange(false)
  }

  return (
    <SkrepayModalBackdrop open={open} onClose={close} width="min(480px, calc(100vw - 2rem))">
      <SkrepayModalHeader
        title="Registrar pago"
        subtitle={
          order
            ? `Pedido #${order.display_id} · ${order.payment_status}`
            : undefined
        }
        onClose={close}
      />
      <div className="space-y-4 px-5 py-5">
        <p className="text-sm" style={{ color: skrepayColors.textMuted }}>
          {payment
            ? "Captura el pago autorizado de este pedido."
            : "Marca la colección de pago como pagada (proveedor manual)."}
        </p>
        {captureMutation.isError ? (
          <p className="text-sm" style={{ color: skrepayColors.danger }}>
            {(captureMutation.error as Error).message}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <SkrepayButton variant="ghost" onClick={close} disabled={captureMutation.isPending}>
            Cancelar
          </SkrepayButton>
          <SkrepayButton
            onClick={() => captureMutation.mutate()}
            disabled={!order || captureMutation.isPending}
          >
            {captureMutation.isPending ? "Procesando…" : "Confirmar pago"}
          </SkrepayButton>
        </div>
      </div>
    </SkrepayModalBackdrop>
  )
}
