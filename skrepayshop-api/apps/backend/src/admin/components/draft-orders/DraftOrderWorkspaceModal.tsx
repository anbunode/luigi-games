import { Badge, Button, FocusModal, Text, toast } from "@medusajs/ui"
import { PencilSquare, Trash } from "@medusajs/icons"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { DraftOrderEditItemsModal } from "./DraftOrderEditItemsModal"
import { DraftPanelCard } from "./DraftOrdersShell"
import {
  convertDraftOrder,
  customerDisplayName,
  deleteDraftOrder,
  fetchDraftOrder,
  formatDraftAddress,
  formatDraftDate,
  formatDraftMoney,
} from "../../lib/draft-orders-api"
import { StoreSettingsModalHeader } from "../store-settings/StoreSettingsModalHeader"

function formatRelativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime()
  const minutes = Math.floor(diffMs / 60000)

  if (minutes < 1) return "ahora"
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `hace ${days} d`
}

function billingMatchesShipping(
  shipping?: { address_1?: string; postal_code?: string; city?: string } | null,
  billing?: { address_1?: string; postal_code?: string; city?: string } | null
) {
  if (!shipping || !billing) return false
  return (
    shipping.address_1 === billing.address_1 &&
    shipping.postal_code === billing.postal_code &&
    shipping.city === billing.city
  )
}

type DraftOrderWorkspaceModalProps = {
  draftId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  autoOpenEditItems?: boolean
}

export function DraftOrderWorkspaceModal({
  draftId,
  open,
  onOpenChange,
  autoOpenEditItems = false,
}: DraftOrderWorkspaceModalProps) {
  const queryClient = useQueryClient()
  const [editItemsOpen, setEditItemsOpen] = useState(false)
  const [didAutoOpenEdit, setDidAutoOpenEdit] = useState(false)

  const draftQuery = useQuery({
    queryKey: ["skrepay", "draft-orders", "detail", draftId],
    queryFn: () => fetchDraftOrder(draftId!),
    enabled: open && Boolean(draftId),
    retry: 1,
  })

  const draft = draftQuery.data
  const items = draft?.items ?? []
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  useEffect(() => {
    if (!open) {
      setDidAutoOpenEdit(false)
      setEditItemsOpen(false)
    }
  }, [open])

  useEffect(() => {
    if (
      open &&
      autoOpenEditItems &&
      !didAutoOpenEdit &&
      draft &&
      !draftQuery.isLoading
    ) {
      setEditItemsOpen(true)
      setDidAutoOpenEdit(true)
    }
  }, [open, autoOpenEditItems, didAutoOpenEdit, draft, draftQuery.isLoading])

  const convertMutation = useMutation({
    mutationFn: () => convertDraftOrder(draftId!),
    onSuccess: () => {
      toast.success("Borrador convertido en pedido")
      onOpenChange(false)
      window.location.href = `/app/orders/${draftId}`
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo convertir el borrador")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteDraftOrder(draftId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skrepay", "draft-orders"] })
      toast.success("Borrador eliminado")
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo eliminar el borrador")
    },
  })

  const customerName = customerDisplayName(draft?.customer)
  const customerEmail = draft?.customer?.email ?? draft?.email ?? "—"
  const sameBilling = billingMatchesShipping(
    draft?.shipping_address,
    draft?.billing_address
  )

  return (
    <>
      <FocusModal open={open} onOpenChange={onOpenChange}>
        <FocusModal.Content className="!flex !max-h-[calc(100vh-2rem)] !w-[min(1100px,calc(100vw-2rem))] !flex-col overflow-hidden">
          <StoreSettingsModalHeader
            title={
              draft ? `Borrador #${draft.display_id}` : "Borrador"
            }
            description={
              draft
                ? `${formatDraftDate(draft.created_at)}${draft.sales_channel?.name ? ` · ${draft.sales_channel.name}` : ""}${draft.region?.name ? ` · ${draft.region.name}` : ""}`
                : "Cargando borrador…"
            }
          />
          <FocusModal.Body className="min-h-0 flex-1 overflow-y-auto p-6">
            {draftQuery.isLoading ? (
              <Text className="text-ui-fg-subtle">Cargando borrador…</Text>
            ) : draftQuery.isError || !draft ? (
              <Text className="text-ui-fg-error">
                {(draftQuery.error as Error)?.message ??
                  "No se pudo cargar el borrador."}
              </Text>
            ) : (
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="flex flex-col gap-4">
                  <DraftPanelCard>
                    <div className="flex items-center justify-between border-b border-ui-border-base px-5 py-4">
                      <Text weight="plus">Resumen</Text>
                      <Button
                        size="small"
                        variant="secondary"
                        type="button"
                        onClick={() => setEditItemsOpen(true)}
                      >
                        <PencilSquare />
                        Editar artículos
                      </Button>
                    </div>

                    {items.length ? (
                      <div className="divide-y divide-dashed divide-ui-border-base">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-4 px-5 py-4"
                          >
                            <div className="min-w-0">
                              <Text weight="plus">{item.title}</Text>
                              {!item.variant_id ? (
                                <Text size="small" className="text-ui-fg-subtle">
                                  Artículo personalizado
                                </Text>
                              ) : null}
                            </div>
                            <div className="flex shrink-0 items-center gap-4 text-sm">
                              <Text size="small" className="text-ui-fg-subtle">
                                {formatDraftMoney(
                                  item.unit_price,
                                  draft.currency_code
                                )}
                              </Text>
                              <Text size="small">{item.quantity}x</Text>
                              <Text size="small" weight="plus">
                                {formatDraftMoney(
                                  item.unit_price * item.quantity,
                                  draft.currency_code
                                )}
                              </Text>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-5 py-10 text-center">
                        <Text className="text-ui-fg-subtle">
                          Aún no hay artículos. Añade productos o un artículo
                          personalizado para continuar.
                        </Text>
                        <Button
                          size="small"
                          className="mt-4"
                          type="button"
                          onClick={() => setEditItemsOpen(true)}
                        >
                          Editar artículos
                        </Button>
                      </div>
                    )}

                    <div className="border-t border-dashed border-ui-border-base px-5 py-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-3">
                          <Text size="small" className="text-ui-fg-subtle">
                            Subtotal · {itemCount}{" "}
                            {itemCount === 1 ? "artículo" : "artículos"}
                          </Text>
                          <Text size="small">
                            {formatDraftMoney(
                              draft.subtotal ?? 0,
                              draft.currency_code
                            )}
                          </Text>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <Text size="small" className="text-ui-fg-subtle">
                            Envío
                          </Text>
                          <Text size="small">
                            {formatDraftMoney(
                              draft.shipping_total ?? 0,
                              draft.currency_code
                            )}
                          </Text>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <Text size="small" className="text-ui-fg-subtle">
                            Descuento
                          </Text>
                          <Text size="small">
                            {formatDraftMoney(
                              draft.discount_total ?? 0,
                              draft.currency_code
                            )}
                          </Text>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <Text size="small" className="text-ui-fg-subtle">
                            Impuestos
                          </Text>
                          <Text size="small">
                            {(draft.tax_total ?? 0) > 0
                              ? formatDraftMoney(
                                  draft.tax_total ?? 0,
                                  draft.currency_code
                                )
                              : "—"}
                          </Text>
                        </div>
                        <div className="flex items-center justify-between gap-3 border-t border-ui-border-base pt-3">
                          <Text weight="plus">Total</Text>
                          <Text size="large" weight="plus">
                            {formatDraftMoney(draft.total ?? 0, draft.currency_code)}{" "}
                            {draft.currency_code.toUpperCase()}
                          </Text>
                        </div>
                      </div>
                    </div>
                  </DraftPanelCard>

                  <DraftPanelCard>
                    <div className="border-b border-ui-border-base px-5 py-4">
                      <Text weight="plus">Envío</Text>
                    </div>
                    <div className="flex items-center justify-between gap-3 px-5 py-4">
                      <div>
                        <Text size="small" weight="plus">
                          Perfil de envío predeterminado
                        </Text>
                        <Text size="small" className="text-ui-fg-subtle">
                          {itemCount}{" "}
                          {itemCount === 1 ? "artículo" : "artículos"}
                        </Text>
                      </div>
                      {itemCount > 0 ? (
                        <Badge size="2xsmall" color="orange">
                          Requiere envío
                        </Badge>
                      ) : (
                        <Badge size="2xsmall" color="grey">
                          Sin artículos
                        </Badge>
                      )}
                    </div>
                  </DraftPanelCard>
                </div>

                <div className="flex flex-col gap-4">
                  <DraftPanelCard>
                    <div className="border-b border-ui-border-base px-5 py-4">
                      <Text weight="plus">Cliente</Text>
                    </div>
                    <div className="flex flex-col gap-4 px-5 py-5">
                      <div>
                        <Text size="small" className="text-ui-fg-subtle">
                          Contacto
                        </Text>
                        <Text weight="plus">
                          {customerName ?? customerEmail}
                        </Text>
                        {customerName ? (
                          <Text size="small" className="text-ui-fg-subtle">
                            {customerEmail}
                          </Text>
                        ) : null}
                      </div>
                      <div>
                        <Text size="small" className="text-ui-fg-subtle">
                          Dirección de envío
                        </Text>
                        <Text
                          size="small"
                          className="mt-1 whitespace-pre-line"
                        >
                          {formatDraftAddress(draft.shipping_address)}
                        </Text>
                      </div>
                      <div>
                        <Text size="small" className="text-ui-fg-subtle">
                          Dirección de facturación
                        </Text>
                        <Text size="small" className="mt-1">
                          {sameBilling
                            ? "Igual que la dirección de envío"
                            : formatDraftAddress(draft.billing_address)}
                        </Text>
                      </div>
                    </div>
                  </DraftPanelCard>

                  <DraftPanelCard>
                    <div className="border-b border-ui-border-base px-5 py-4">
                      <Text weight="plus">Actividad</Text>
                    </div>
                    <div className="flex flex-col gap-4 px-5 py-5">
                      {items.length ? (
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <Text size="small" weight="plus">
                              Artículos añadidos
                            </Text>
                            <Text size="small" className="text-ui-fg-subtle">
                              Se añadieron {itemCount}{" "}
                              {itemCount === 1 ? "artículo" : "artículos"}
                            </Text>
                          </div>
                          <Text size="small" className="text-ui-fg-subtle">
                            {formatRelativeTime(draft.created_at)}
                          </Text>
                        </div>
                      ) : null}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Text size="small" weight="plus">
                            Borrador creado
                          </Text>
                        </div>
                        <Text size="small" className="text-ui-fg-subtle">
                          {formatRelativeTime(draft.created_at)}
                        </Text>
                      </div>
                    </div>
                  </DraftPanelCard>
                </div>
              </div>
            )}
          </FocusModal.Body>
          <FocusModal.Footer>
            <div className="flex w-full items-center justify-between gap-3">
              <Button
                size="small"
                variant="secondary"
                type="button"
                isLoading={deleteMutation.isPending}
                onClick={() => {
                  if (window.confirm("¿Eliminar este borrador?")) {
                    deleteMutation.mutate()
                  }
                }}
              >
                <Trash />
                Eliminar
              </Button>
              <div className="flex items-center gap-2">
                <FocusModal.Close asChild>
                  <Button size="small" variant="secondary" type="button">
                    Cerrar
                  </Button>
                </FocusModal.Close>
                <Button
                  size="small"
                  type="button"
                  disabled={!items.length}
                  isLoading={convertMutation.isPending}
                  onClick={() => convertMutation.mutate()}
                >
                  Convertir en pedido
                </Button>
              </div>
            </div>
          </FocusModal.Footer>
        </FocusModal.Content>
      </FocusModal>

      {draftId ? (
        <DraftOrderEditItemsModal
          draftId={draftId}
          open={editItemsOpen}
          onOpenChange={(next) => {
            setEditItemsOpen(next)
            if (!next) {
              draftQuery.refetch()
              queryClient.invalidateQueries({
                queryKey: ["skrepay", "draft-orders"],
              })
            }
          }}
        />
      ) : null}
    </>
  )
}
