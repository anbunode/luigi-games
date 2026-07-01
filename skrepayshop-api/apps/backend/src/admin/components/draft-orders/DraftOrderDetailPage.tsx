import { Badge, Button, Select, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useLayoutEffect, useState } from "react"
import { DraftOrdersShell, DraftPanelCard } from "./DraftOrdersShell"
import {
  addVariantToDraft,
  convertDraftOrder,
  deleteDraftOrder,
  fetchDraftOrder,
  fetchDraftProducts,
  formatDraftDate,
  formatDraftMoney,
} from "../../lib/draft-orders-api"
import { installAuthBridge } from "../../lib/auth-bridge"

export function DraftOrderDetailPage({ id }: { id: string }) {
  useLayoutEffect(() => {
    installAuthBridge()
  }, [])

  const queryClient = useQueryClient()
  const [variantId, setVariantId] = useState("")

  const draftQuery = useQuery({
    queryKey: ["skrepay", "draft-orders", "detail", id],
    queryFn: () => fetchDraftOrder(id),
    retry: 1,
  })

  const productsQuery = useQuery({
    queryKey: ["skrepay", "draft-orders", "products"],
    queryFn: fetchDraftProducts,
    retry: 1,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["skrepay", "draft-orders"] })
  }

  const addItemMutation = useMutation({
    mutationFn: (variant: string) => addVariantToDraft(id, variant, 1),
    onSuccess: () => {
      invalidate()
      draftQuery.refetch()
      setVariantId("")
      toast.success("Producto añadido")
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo añadir el producto")
    },
  })

  const convertMutation = useMutation({
    mutationFn: () => convertDraftOrder(id),
    onSuccess: () => {
      toast.success("Borrador convertido en pedido")
      window.location.href = `/app/orders/${id}`
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo convertir el borrador")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteDraftOrder(id),
    onSuccess: () => {
      toast.success("Borrador eliminado")
      window.location.href = "/app/draft-orders"
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo eliminar el borrador")
    },
  })

  const draft = draftQuery.data
  const variants =
    productsQuery.data?.flatMap((product) =>
      (product.variants ?? []).map((variant) => ({
        id: variant.id,
        label: `${product.title}${variant.sku ? ` · ${variant.sku}` : ""}`,
      }))
    ) ?? []

  return (
    <DraftOrdersShell
      title={draft ? `Borrador #${draft.display_id}` : "Borrador"}
      description={
        draft
          ? `${draft.customer?.email ?? draft.email ?? "Sin correo"} · ${formatDraftDate(draft.created_at)}`
          : undefined
      }
      actions={
        <>
          <Button size="small" variant="secondary" asChild>
            <a href="/app/draft-orders">Volver</a>
          </Button>
          {draft ? (
            <>
              <Button
                size="small"
                variant="secondary"
                isLoading={deleteMutation.isPending}
                onClick={() => {
                  if (window.confirm("¿Eliminar este borrador?")) {
                    deleteMutation.mutate()
                  }
                }}
              >
                Eliminar
              </Button>
              <Button
                size="small"
                isLoading={convertMutation.isPending}
                onClick={() => convertMutation.mutate()}
              >
                Convertir en pedido
              </Button>
            </>
          ) : null}
        </>
      }
    >
      {draftQuery.isLoading ? (
        <DraftPanelCard>
          <div className="px-5 py-8">
            <Text className="text-ui-fg-subtle">Cargando borrador…</Text>
          </div>
        </DraftPanelCard>
      ) : draftQuery.isError || !draft ? (
        <DraftPanelCard>
          <div className="px-5 py-8">
            <Text className="text-ui-fg-error">
              {(draftQuery.error as Error)?.message ??
                "No se pudo cargar el borrador."}
            </Text>
          </div>
        </DraftPanelCard>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
          <DraftPanelCard>
            <div className="border-b border-ui-border-base px-5 py-4">
              <Text weight="plus">Artículos</Text>
            </div>
            {draft.items?.length ? (
              <div className="divide-y divide-ui-border-base">
                {draft.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 px-5 py-4"
                  >
                    <div>
                      <Text weight="plus">{item.title}</Text>
                      <Text size="small" className="text-ui-fg-subtle">
                        Cantidad: {item.quantity}
                      </Text>
                    </div>
                    <Text>
                      {formatDraftMoney(
                        item.unit_price * item.quantity,
                        draft.currency_code
                      )}
                    </Text>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-8">
                <Text className="text-ui-fg-subtle">
                  Este borrador aún no tiene productos.
                </Text>
              </div>
            )}
            <div className="border-t border-ui-border-base px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Text size="small" className="mb-2 block text-ui-fg-subtle">
                    Añadir producto del catálogo
                  </Text>
                  <Select value={variantId} onValueChange={setVariantId}>
                    <Select.Trigger>
                      <Select.Value placeholder="Selecciona una variante" />
                    </Select.Trigger>
                    <Select.Content>
                      {variants.map((variant) => (
                        <Select.Item key={variant.id} value={variant.id}>
                          {variant.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                </div>
                <Button
                  size="small"
                  disabled={!variantId}
                  isLoading={addItemMutation.isPending}
                  onClick={() => {
                    if (variantId) {
                      addItemMutation.mutate(variantId)
                    }
                  }}
                >
                  Añadir
                </Button>
              </div>
            </div>
          </DraftPanelCard>

          <DraftPanelCard>
            <div className="flex flex-col gap-4 px-5 py-5">
              <div>
                <Text size="small" className="text-ui-fg-subtle">
                  Total
                </Text>
                <Text size="xlarge" weight="plus">
                  {formatDraftMoney(draft.total ?? 0, draft.currency_code)}
                </Text>
              </div>
              <div>
                <Text size="small" className="text-ui-fg-subtle">
                  Región
                </Text>
                <Text>{draft.region?.name ?? "—"}</Text>
              </div>
              <div>
                <Text size="small" className="text-ui-fg-subtle">
                  Canal de ventas
                </Text>
                <Text>{draft.sales_channel?.name ?? "—"}</Text>
              </div>
              <div>
                <Text size="small" className="text-ui-fg-subtle">
                  Estado
                </Text>
                <Badge size="2xsmall" color="grey">
                  {draft.status}
                </Badge>
              </div>
            </div>
          </DraftPanelCard>
        </div>
      )}
    </DraftOrdersShell>
  )
}
