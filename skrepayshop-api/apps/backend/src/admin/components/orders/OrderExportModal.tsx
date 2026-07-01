import { useMutation } from "@tanstack/react-query"
import { toast } from "@medusajs/ui"
import { useState } from "react"
import { exportOrders } from "../../lib/orders-api"
import { skrepayColors } from "../../lib/skrepay-theme"
import {
  SkrepayButton,
  SkrepayFieldLabel,
  SkrepayModalBackdrop,
  SkrepayModalHeader,
  skrepayInputStyle,
} from "./OrdersUi"

type OrderExportModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OrderExportModal({ open, onOpenChange }: OrderExportModalProps) {
  const [successId, setSuccessId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const exportMutation = useMutation({
    mutationFn: () => exportOrders({}),
    onSuccess: (data) => {
      setSuccessId(data.transaction_id)
      setError(null)
      toast.success("Exportación iniciada")
    },
    onError: (err: Error) => {
      setError(err.message || "No se pudo iniciar la exportación")
      setSuccessId(null)
    },
  })

  const close = () => {
    onOpenChange(false)
    setSuccessId(null)
    setError(null)
  }

  return (
    <SkrepayModalBackdrop open={open} onClose={close}>
      <SkrepayModalHeader
        title="Exportar pedidos"
        subtitle="Genera un archivo CSV con los pedidos de la tienda."
        onClose={close}
      />
      <div className="space-y-4 px-5 py-5">
        {successId ? (
          <div
            className="rounded px-4 py-3 text-sm"
            style={{
              background: skrepayColors.successBg,
              color: skrepayColors.success,
              border: `1px solid rgba(107, 196, 138, 0.28)`,
            }}
          >
            Exportación iniciada. ID de transacción:{" "}
            <span className="font-mono">{successId}</span>
          </div>
        ) : (
          <>
            <p className="text-sm" style={{ color: skrepayColors.textMuted }}>
              La exportación se procesa en segundo plano. Recibirás el archivo
              cuando Medusa complete el workflow.
            </p>
            {error ? (
              <p className="text-sm" style={{ color: skrepayColors.danger }}>
                {error}
              </p>
            ) : null}
          </>
        )}
        <div className="flex justify-end gap-2">
          <SkrepayButton variant="ghost" onClick={close}>
            Cerrar
          </SkrepayButton>
          {!successId ? (
            <SkrepayButton
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
            >
              {exportMutation.isPending ? "Exportando…" : "Iniciar exportación"}
            </SkrepayButton>
          ) : null}
        </div>
      </div>
    </SkrepayModalBackdrop>
  )
}
