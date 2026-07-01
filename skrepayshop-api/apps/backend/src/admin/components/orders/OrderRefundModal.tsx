import { useMutation } from "@tanstack/react-query"
import { toast } from "@medusajs/ui"
import { useState } from "react"
import {
  formatOrderMoney,
  getCapturedPayment,
  refundPayment,
  type OrderDetail,
} from "../../lib/orders-api"
import { skrepayColors } from "../../lib/skrepay-theme"
import {
  SkrepayButton,
  SkrepayFieldLabel,
  SkrepayModalBackdrop,
  SkrepayModalHeader,
  skrepayInputStyle,
} from "./OrdersUi"

type OrderRefundModalProps = {
  open: boolean
  order: OrderDetail | null
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function OrderRefundModal({
  open,
  order,
  onOpenChange,
  onSuccess,
}: OrderRefundModalProps) {
  const payment = order ? getCapturedPayment(order) : null
  const targetPayment = payment

  const [amount, setAmount] = useState("")

  const refundMutation = useMutation({
    mutationFn: async () => {
      if (!targetPayment?.id) {
        throw new Error("No hay un pago capturado para reembolsar")
      }
      const cents = Math.round(Number(amount) * 100)
      if (!cents || cents <= 0) {
        throw new Error("Indica un importe válido")
      }
      await refundPayment(targetPayment.id, cents)
    },
    onSuccess: () => {
      toast.success("Reembolso registrado")
      onSuccess()
      onOpenChange(false)
      setAmount("")
    },
  })

  const close = () => {
    if (!refundMutation.isPending) {
      onOpenChange(false)
      setAmount("")
    }
  }

  return (
    <SkrepayModalBackdrop open={open} onClose={close} width="min(480px, calc(100vw - 2rem))">
      <SkrepayModalHeader
        title="Reembolsar pago"
        subtitle={order ? `Pedido #${order.display_id}` : undefined}
        onClose={close}
      />
      <div className="space-y-4 px-5 py-5">
        <div>
          <SkrepayFieldLabel>Importe ({order?.currency_code?.toUpperCase() ?? ""})</SkrepayFieldLabel>
          <input
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder={
              order ? formatOrderMoney(order.total ?? 0, order.currency_code) : "0.00"
            }
            style={skrepayInputStyle()}
          />
        </div>
        {!targetPayment ? (
          <p className="text-sm" style={{ color: skrepayColors.warning }}>
            Este pedido no tiene un pago capturado disponible para reembolso.
          </p>
        ) : null}
        {refundMutation.isError ? (
          <p className="text-sm" style={{ color: skrepayColors.danger }}>
            {(refundMutation.error as Error).message}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <SkrepayButton variant="ghost" onClick={close} disabled={refundMutation.isPending}>
            Cancelar
          </SkrepayButton>
          <SkrepayButton
            onClick={() => refundMutation.mutate()}
            disabled={!targetPayment || refundMutation.isPending}
          >
            {refundMutation.isPending ? "Reembolsando…" : "Confirmar reembolso"}
          </SkrepayButton>
        </div>
      </div>
    </SkrepayModalBackdrop>
  )
}
