import { useMutation } from "@tanstack/react-query"
import { toast } from "@medusajs/ui"
import { cancelOrder } from "../../lib/orders-api"
import { skrepayColors } from "../../lib/skrepay-theme"
import {
  SkrepayButton,
  SkrepayModalBackdrop,
  SkrepayModalHeader,
} from "./OrdersUi"

type OrderCancelModalProps = {
  open: boolean
  orderId: string | null
  displayId?: number
  onOpenChange: (open: boolean) => void
  onCanceled: () => void
}

export function OrderCancelModal({
  open,
  orderId,
  displayId,
  onOpenChange,
  onCanceled,
}: OrderCancelModalProps) {
  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(orderId!),
    onSuccess: () => {
      toast.success("Pedido cancelado")
      onCanceled()
      onOpenChange(false)
    },
  })

  const close = () => {
    if (!cancelMutation.isPending) {
      onOpenChange(false)
    }
  }

  return (
    <SkrepayModalBackdrop open={open} onClose={close} width="min(480px, calc(100vw - 2rem))">
      <SkrepayModalHeader
        title={`Cancelar pedido #${displayId ?? ""}`}
        subtitle="Esta acción no se puede deshacer."
        onClose={close}
      />
      <div className="space-y-4 px-5 py-5">
        <p className="text-sm" style={{ color: skrepayColors.textMuted }}>
          El pedido quedará marcado como cancelado. Los pagos y cumplimientos
          pendientes dejarán de estar disponibles.
        </p>
        {cancelMutation.isError ? (
          <p className="text-sm" style={{ color: skrepayColors.danger }}>
            {(cancelMutation.error as Error).message}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <SkrepayButton variant="ghost" onClick={close} disabled={cancelMutation.isPending}>
            Volver
          </SkrepayButton>
          <SkrepayButton
            variant="danger"
            disabled={!orderId || cancelMutation.isPending}
            onClick={() => cancelMutation.mutate()}
          >
            {cancelMutation.isPending ? "Cancelando…" : "Confirmar cancelación"}
          </SkrepayButton>
        </div>
      </div>
    </SkrepayModalBackdrop>
  )
}
