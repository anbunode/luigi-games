import { Badge, Input, Label, Switch, Text, toast } from "@medusajs/ui"
import { ReceiptPercent } from "@medusajs/icons"
import { useMutation } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import {
  defaultPaymentDueDateInput,
  formatPaymentDueDate,
  paymentDueInputToIso,
  paymentDueIsoToInput,
  readDraftPaymentTerms,
  updateDraftPaymentTerms,
  type DraftOrderSummary,
} from "../../lib/draft-orders-api"

type DraftOrderPaymentTermsCardProps = {
  draft: DraftOrderSummary
  onUpdated: () => void
}

export function DraftOrderPaymentTermsCard({
  draft,
  onUpdated,
}: DraftOrderPaymentTermsCardProps) {
  const saved = readDraftPaymentTerms(draft.metadata)
  const [enabled, setEnabled] = useState(saved.enabled)
  const [dueDateInput, setDueDateInput] = useState(
    paymentDueIsoToInput(saved.dueAt)
  )

  useEffect(() => {
    const terms = readDraftPaymentTerms(draft.metadata)
    setEnabled(terms.enabled)
    setDueDateInput(paymentDueIsoToInput(terms.dueAt))
  }, [draft.metadata, draft.id])

  const saveMutation = useMutation({
    mutationFn: (terms: { enabled: boolean; dueAt: string | null }) =>
      updateDraftPaymentTerms(draft, terms),
    onSuccess: () => {
      onUpdated()
      toast.success("Condiciones de cobro guardadas")
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudieron guardar las condiciones")
    },
  })

  const persist = (nextEnabled: boolean, nextDateInput: string) => {
    saveMutation.mutate({
      enabled: nextEnabled,
      dueAt: nextEnabled ? paymentDueInputToIso(nextDateInput) : null,
    })
  }

  return (
    <div className="overflow-hidden rounded-xl border border-ui-border-base bg-ui-bg-base shadow-borders-base">
      <div className="flex items-center gap-2 border-b border-ui-border-base px-5 py-4">
        <ReceiptPercent className="text-ui-fg-subtle" />
        <Text weight="plus">Cobro y vencimiento</Text>
        {enabled ? (
          <Badge size="2xsmall" color="orange" className="ml-auto">
            Factura con vencimiento
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 px-5 py-5">
        <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-4">
          <div className="grid grid-cols-[28px_1fr] items-start gap-3">
            <Switch
              size="small"
              checked={enabled}
              disabled={saveMutation.isPending}
              onCheckedChange={(checked) => {
                const nextDate = dueDateInput || defaultPaymentDueDateInput()
                setEnabled(checked)
                if (checked && !dueDateInput) {
                  setDueDateInput(nextDate)
                }
                persist(checked, nextDate)
              }}
            />
            <div>
              <Label className="txt-compact-small-plus">
                Factura con fecha de vencimiento
              </Label>
              <Text size="small" className="text-ui-fg-subtle mt-1">
                El cliente tendrá una fecha tope para pagar con el link de cobro.
                Si no paga a tiempo, el pedido expirará.
              </Text>
            </div>
          </div>
        </div>

        {enabled ? (
          <div className="flex flex-col gap-y-2">
            <Label htmlFor={`payment-due-${draft.id}`}>Fecha límite de pago</Label>
            <Input
              id={`payment-due-${draft.id}`}
              type="date"
              value={dueDateInput}
              disabled={saveMutation.isPending}
              onChange={(event) => {
                const next = event.target.value
                setDueDateInput(next)
                if (next) {
                  persist(true, next)
                }
              }}
            />
            <Text size="small" className="text-ui-fg-subtle">
              Vence el {formatPaymentDueDate(paymentDueInputToIso(dueDateInput))}.
              El link de pago usará esta fecha cuando esté disponible.
            </Text>
          </div>
        ) : (
          <Text size="small" className="text-ui-fg-subtle">
            Sin vencimiento: el borrador no expirará automáticamente por falta de
            pago.
          </Text>
        )}
      </div>
    </div>
  )
}
