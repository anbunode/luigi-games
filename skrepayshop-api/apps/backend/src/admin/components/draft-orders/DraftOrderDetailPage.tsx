import { Badge, Button, Input, Label, Text, toast } from "@medusajs/ui"
import { MagnifyingGlass, Plus, Trash } from "@medusajs/icons"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useLayoutEffect, useMemo, useState } from "react"
import { DraftOrdersShell, DraftPanelCard } from "./DraftOrdersShell"
import {
  addCustomItemToDraft,
  addVariantToDraft,
  convertDraftOrder,
  customerDisplayName,
  deleteDraftOrder,
  fetchDraftOrder,
  formatDraftAddress,
  formatDraftDate,
  formatDraftMoney,
  searchDraftProducts,
  updateDraftItemQuantity,
  type DraftProduct,
} from "../../lib/draft-orders-api"
import { installAuthBridge } from "../../lib/auth-bridge"

function productVariantOptions(products: DraftProduct[]) {
  return products.flatMap((product) =>
    (product.variants ?? []).map((variant) => ({
      id: variant.id,
      productTitle: product.title,
      label: `${product.title}${variant.title ? ` · ${variant.title}` : ""}${
        variant.sku ? ` (${variant.sku})` : ""
      }`,
      sku: variant.sku,
      price: variant.prices?.[0]?.amount,
    }))
  )
}

export function DraftOrderDetailPage({ id }: { id: string }) {
  useLayoutEffect(() => {
    installAuthBridge()
  }, [])

  const queryClient = useQueryClient()
  const [productQuery, setProductQuery] = useState("")
  const [selectedVariantId, setSelectedVariantId] = useState("")
  const [addQuantity, setAddQuantity] = useState("1")
  const [customTitle, setCustomTitle] = useState("")
  const [customQuantity, setCustomQuantity] = useState("1")
  const [customPrice, setCustomPrice] = useState("")

  const draftQuery = useQuery({
    queryKey: ["skrepay", "draft-orders", "detail", id],
    queryFn: () => fetchDraftOrder(id),
    retry: 1,
  })

  const productsQuery = useQuery({
    queryKey: ["skrepay", "draft-orders", "products", productQuery],
    queryFn: () => searchDraftProducts(productQuery),
    retry: 1,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["skrepay", "draft-orders"] })
  }

  const refreshDraft = () => draftQuery.refetch()

  const addItemMutation = useMutation({
    mutationFn: () =>
      addVariantToDraft(id, selectedVariantId, Number(addQuantity) || 1),
    onSuccess: () => {
      invalidate()
      refreshDraft()
      setSelectedVariantId("")
      setAddQuantity("1")
      toast.success("Producto añadido")
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo añadir el producto")
    },
  })

  const addCustomMutation = useMutation({
    mutationFn: () => {
      const quantity = Number(customQuantity) || 1
      const unitPrice = Math.round((Number(customPrice) || 0) * 100)
      return addCustomItemToDraft(id, {
        title: customTitle.trim(),
        quantity,
        unit_price: unitPrice,
      })
    },
    onSuccess: () => {
      invalidate()
      refreshDraft()
      setCustomTitle("")
      setCustomQuantity("1")
      setCustomPrice("")
      toast.success("Artículo personalizado añadido")
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo añadir el artículo")
    },
  })

  const updateQtyMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      updateDraftItemQuantity(id, itemId, quantity),
    onSuccess: () => {
      invalidate()
      refreshDraft()
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo actualizar la cantidad")
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
  const variants = useMemo(
    () => productVariantOptions(productsQuery.data ?? []),
    [productsQuery.data]
  )

  const customerName = customerDisplayName(draft?.customer)
  const customerEmail = draft?.customer?.email ?? draft?.email ?? "Sin correo"

  return (
    <DraftOrdersShell
      title={draft ? `Borrador #${draft.display_id}` : "Borrador"}
      description={
        draft
          ? `${customerEmail}${customerName ? ` · ${customerName}` : ""} · ${formatDraftDate(draft.created_at)}`
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
                disabled={!draft.items?.length}
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
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-4">
            <DraftPanelCard>
              <div className="border-b border-ui-border-base px-5 py-4">
                <Text weight="plus">Artículos</Text>
                <Text size="small" className="text-ui-fg-subtle mt-1">
                  Añade productos del catálogo o artículos personalizados
                </Text>
              </div>

              {draft.items?.length ? (
                <div className="divide-y divide-ui-border-base">
                  {draft.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <Text weight="plus">{item.title}</Text>
                        {item.sku ? (
                          <Text size="small" className="text-ui-fg-subtle">
                            SKU: {item.sku}
                          </Text>
                        ) : null}
                        <Text size="small" className="text-ui-fg-subtle">
                          {formatDraftMoney(item.unit_price, draft.currency_code)}{" "}
                          / unidad
                        </Text>
                      </div>

                      <div className="flex items-center gap-2">
                        <Input
                          className="w-20"
                          type="number"
                          min={0}
                          value={String(item.quantity)}
                          disabled={updateQtyMutation.isPending}
                          onChange={(event) => {
                            const quantity = Number(event.target.value)
                            if (Number.isNaN(quantity) || quantity < 0) return
                            updateQtyMutation.mutate({ itemId: item.id, quantity })
                          }}
                        />
                        <Text className="min-w-[88px] text-right">
                          {formatDraftMoney(
                            item.unit_price * item.quantity,
                            draft.currency_code
                          )}
                        </Text>
                        <Button
                          size="small"
                          variant="transparent"
                          isLoading={updateQtyMutation.isPending}
                          onClick={() =>
                            updateQtyMutation.mutate({
                              itemId: item.id,
                              quantity: 0,
                            })
                          }
                        >
                          <Trash />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-8">
                  <Text className="text-ui-fg-subtle">
                    Este borrador aún no tiene artículos. Añade productos del
                    catálogo o un artículo personalizado.
                  </Text>
                </div>
              )}
            </DraftPanelCard>

            <DraftPanelCard>
              <div className="border-b border-ui-border-base px-5 py-4">
                <Text weight="plus">Añadir productos</Text>
              </div>
              <div className="flex flex-col gap-4 px-5 py-5">
                <div className="relative">
                  <MagnifyingGlass className="text-ui-fg-subtle absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    className="pl-9"
                    placeholder="Buscar productos por nombre o SKU"
                    value={productQuery}
                    onChange={(event) => setProductQuery(event.target.value)}
                  />
                </div>

                <div className="max-h-56 overflow-y-auto rounded-lg border border-ui-border-base">
                  {variants.length ? (
                    variants.map((variant) => (
                      <button
                        key={variant.id}
                        type="button"
                        className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-ui-bg-base-hover ${
                          selectedVariantId === variant.id
                            ? "bg-ui-bg-base-hover"
                            : ""
                        }`}
                        onClick={() => setSelectedVariantId(variant.id)}
                      >
                        <div>
                          <Text size="small" weight="plus">
                            {variant.label}
                          </Text>
                        </div>
                        {variant.price != null ? (
                          <Text size="small" className="text-ui-fg-subtle">
                            {formatDraftMoney(variant.price, draft.currency_code)}
                          </Text>
                        ) : null}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-6">
                      <Text size="small" className="text-ui-fg-subtle">
                        No hay productos para mostrar.
                      </Text>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex flex-col gap-y-2 sm:w-28">
                    <Label>Cantidad</Label>
                    <Input
                      type="number"
                      min={1}
                      value={addQuantity}
                      onChange={(event) => setAddQuantity(event.target.value)}
                    />
                  </div>
                  <Button
                    size="small"
                    disabled={!selectedVariantId}
                    isLoading={addItemMutation.isPending}
                    onClick={() => addItemMutation.mutate()}
                  >
                    <Plus />
                    Añadir producto
                  </Button>
                </div>
              </div>
            </DraftPanelCard>

            <DraftPanelCard>
              <div className="border-b border-ui-border-base px-5 py-4">
                <Text weight="plus">Artículo personalizado</Text>
                <Text size="small" className="text-ui-fg-subtle mt-1">
                  Para cargos, ajustes o productos que no están en el catálogo
                </Text>
              </div>
              <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
                <div className="flex flex-col gap-y-2 sm:col-span-2">
                  <Label>Título</Label>
                  <Input
                    value={customTitle}
                    placeholder="Ej. Instalación, envío especial…"
                    onChange={(event) => setCustomTitle(event.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-y-2">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    min={1}
                    value={customQuantity}
                    onChange={(event) => setCustomQuantity(event.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-y-2">
                  <Label>Precio unitario ({draft.currency_code.toUpperCase()})</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={customPrice}
                    placeholder="0.00"
                    onChange={(event) => setCustomPrice(event.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button
                    size="small"
                    variant="secondary"
                    disabled={!customTitle.trim() || !customPrice}
                    isLoading={addCustomMutation.isPending}
                    onClick={() => addCustomMutation.mutate()}
                  >
                    Añadir artículo personalizado
                  </Button>
                </div>
              </div>
            </DraftPanelCard>
          </div>

          <div className="flex flex-col gap-4">
            <DraftPanelCard>
              <div className="border-b border-ui-border-base px-5 py-4">
                <Text weight="plus">Resumen</Text>
              </div>
              <div className="flex flex-col gap-3 px-5 py-5">
                <div className="flex items-center justify-between gap-3">
                  <Text size="small" className="text-ui-fg-subtle">
                    Subtotal
                  </Text>
                  <Text size="small">
                    {formatDraftMoney(draft.subtotal ?? 0, draft.currency_code)}
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
                    Impuestos
                  </Text>
                  <Text size="small">
                    {formatDraftMoney(draft.tax_total ?? 0, draft.currency_code)}
                  </Text>
                </div>
                {(draft.discount_total ?? 0) > 0 ? (
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
                ) : null}
                <div className="border-t border-ui-border-base pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <Text weight="plus">Total</Text>
                    <Text size="xlarge" weight="plus">
                      {formatDraftMoney(draft.total ?? 0, draft.currency_code)}
                    </Text>
                  </div>
                </div>
                <Badge size="2xsmall" color="grey">
                  {draft.status}
                </Badge>
              </div>
            </DraftPanelCard>

            <DraftPanelCard>
              <div className="border-b border-ui-border-base px-5 py-4">
                <Text weight="plus">Cliente</Text>
              </div>
              <div className="flex flex-col gap-2 px-5 py-5">
                <Text>{customerEmail}</Text>
                {customerName ? (
                  <Text size="small" className="text-ui-fg-subtle">
                    {customerName}
                  </Text>
                ) : null}
              </div>
            </DraftPanelCard>

            <DraftPanelCard>
              <div className="border-b border-ui-border-base px-5 py-4">
                <Text weight="plus">Región y canal</Text>
              </div>
              <div className="flex flex-col gap-3 px-5 py-5">
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
              </div>
            </DraftPanelCard>

            <DraftPanelCard>
              <div className="border-b border-ui-border-base px-5 py-4">
                <Text weight="plus">Envío</Text>
              </div>
              <div className="px-5 py-5">
                <Text size="small" className="whitespace-pre-line text-ui-fg-subtle">
                  {formatDraftAddress(draft.shipping_address)}
                </Text>
              </div>
            </DraftPanelCard>

            <DraftPanelCard>
              <div className="border-b border-ui-border-base px-5 py-4">
                <Text weight="plus">Facturación</Text>
              </div>
              <div className="px-5 py-5">
                <Text size="small" className="whitespace-pre-line text-ui-fg-subtle">
                  {formatDraftAddress(draft.billing_address)}
                </Text>
              </div>
            </DraftPanelCard>
          </div>
        </div>
      )}
    </DraftOrdersShell>
  )
}
