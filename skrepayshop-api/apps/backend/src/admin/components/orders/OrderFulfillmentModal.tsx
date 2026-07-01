import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import {
  createOrderFulfillment,
  fetchStockLocations,
  getUnfulfilledLineItems,
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

type OrderFulfillmentModalProps = {
  open: boolean
  order: OrderDetail | null
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function OrderFulfillmentModal({
  open,
  order,
  onOpenChange,
  onSuccess,
}: OrderFulfillmentModalProps) {
  const unfulfilled = order ? getUnfulfilledLineItems(order) : []
  const [locationId, setLocationId] = useState("")
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  const locationsQuery = useQuery({
    queryKey: ["skrepay", "orders", "stock-locations"],
    queryFn: fetchStockLocations,
    enabled: open,
  })

  useEffect(() => {
    if (!open || !order) return
    const initial: Record<string, number> = {}
    for (const row of getUnfulfilledLineItems(order)) {
      initial[row.item.id] = row.remaining
    }
    setQuantities(initial)
  }, [open, order])

  useEffect(() => {
    const first = locationsQuery.data?.[0]?.id
    if (first && !locationId) {
      setLocationId(first)
    }
  }, [locationsQuery.data, locationId])

  const fulfillMutation = useMutation({
    mutationFn: async () => {
      if (!order) throw new Error("Pedido no disponible")
      if (!locationId) throw new Error("Selecciona una ubicación de inventario")

      const items = Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([id, quantity]) => ({ id, quantity }))

      if (!items.length) {
        throw new Error("Indica al menos un artículo para cumplir")
      }

      await createOrderFulfillment(order.id, locationId, items)
    },
    onSuccess: () => {
      toast.success("Cumplimiento creado")
      onSuccess()
      onOpenChange(false)
    },
  })

  const close = () => {
    if (!fulfillMutation.isPending) onOpenChange(false)
  }

  return (
    <SkrepayModalBackdrop open={open} onClose={close} width="min(640px, calc(100vw - 2rem))">
      <SkrepayModalHeader
        title="Cumplir pedido"
        subtitle={order ? `Pedido #${order.display_id}` : undefined}
        onClose={close}
      />
      <div className="space-y-4 px-5 py-5">
        <div>
          <SkrepayFieldLabel>Ubicación de inventario</SkrepayFieldLabel>
          <select
            value={locationId}
            onChange={(event) => setLocationId(event.target.value)}
            style={skrepayInputStyle()}
          >
            <option value="">Seleccionar…</option>
            {(locationsQuery.data ?? []).map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <SkrepayFieldLabel>Artículos</SkrepayFieldLabel>
          {unfulfilled.map(({ item, remaining }) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded px-3 py-2"
              style={{
                border: `1px solid ${skrepayColors.border}`,
                background: skrepayColors.surface,
              }}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium" style={{ color: skrepayColors.text }}>
                  {item.title}
                </p>
                <p className="text-xs" style={{ color: skrepayColors.textMuted }}>
                  Pendiente: {remaining}
                </p>
              </div>
              <input
                type="number"
                min={0}
                max={remaining}
                value={quantities[item.id] ?? 0}
                onChange={(event) =>
                  setQuantities((prev) => ({
                    ...prev,
                    [item.id]: Math.min(
                      remaining,
                      Math.max(0, Number(event.target.value) || 0)
                    ),
                  }))
                }
                className="w-20 text-center"
                style={skrepayInputStyle()}
              />
            </div>
          ))}
        </div>

        {fulfillMutation.isError ? (
          <p className="text-sm" style={{ color: skrepayColors.danger }}>
            {(fulfillMutation.error as Error).message}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <SkrepayButton variant="ghost" onClick={close} disabled={fulfillMutation.isPending}>
            Cancelar
          </SkrepayButton>
          <SkrepayButton
            onClick={() => fulfillMutation.mutate()}
            disabled={!order || fulfillMutation.isPending}
          >
            {fulfillMutation.isPending ? "Cumpliendo…" : "Crear cumplimiento"}
          </SkrepayButton>
        </div>
      </div>
    </SkrepayModalBackdrop>
  )
}
