import { Badge, Button, FocusModal, Input, Label, Text, toast } from "@medusajs/ui"
import { MagnifyingGlass, Plus, Trash } from "@medusajs/icons"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useDeferredValue, useId, useMemo, useState } from "react"
import {
  addCustomItemToDraft,
  addVariantToDraft,
  fetchDraftOrder,
  formatDraftMoney,
  searchDraftProducts,
  updateDraftItemQuantity,
  type DraftProduct,
} from "../../lib/draft-orders-api"
import { StoreSettingsModalHeader } from "../store-settings/StoreSettingsModalHeader"

function productVariantOptions(products: DraftProduct[]) {
  return products.flatMap((product) =>
    (product.variants ?? []).map((variant) => ({
      id: variant.id,
      label: `${product.title}${variant.title ? ` · ${variant.title}` : ""}${
        variant.sku ? ` (${variant.sku})` : ""
      }`,
      price: variant.prices?.[0]?.amount,
    }))
  )
}

type DraftOrderEditItemsModalProps = {
  draftId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DraftOrderEditItemsModal({
  draftId,
  open,
  onOpenChange,
}: DraftOrderEditItemsModalProps) {
  const formId = useId()
  const queryClient = useQueryClient()
  const [productQuery, setProductQuery] = useState("")
  const [customTitle, setCustomTitle] = useState("")
  const [customQuantity, setCustomQuantity] = useState("1")
  const [customPrice, setCustomPrice] = useState("")
  const [showCustomForm, setShowCustomForm] = useState(false)
  const debouncedQuery = useDeferredValue(productQuery.trim())

  const draftQuery = useQuery({
    queryKey: ["skrepay", "draft-orders", "detail", draftId],
    queryFn: () => fetchDraftOrder(draftId),
    enabled: open && Boolean(draftId),
    retry: 1,
  })

  const productsQuery = useQuery({
    queryKey: ["skrepay", "draft-orders", "products", debouncedQuery],
    queryFn: () => searchDraftProducts(debouncedQuery),
    enabled: open && debouncedQuery.length >= 2,
    retry: 1,
  })

  const draft = draftQuery.data
  const variants = useMemo(
    () => productVariantOptions(productsQuery.data ?? []),
    [productsQuery.data]
  )

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["skrepay", "draft-orders"] })
  }

  const refresh = () => draftQuery.refetch()

  const addCustomMutation = useMutation({
    mutationFn: () =>
      addCustomItemToDraft(draftId, {
        title: customTitle.trim(),
        quantity: Number(customQuantity) || 1,
        unit_price: Math.round((Number(customPrice) || 0) * 100),
      }),
    onSuccess: () => {
      invalidate()
      refresh()
      setCustomTitle("")
      setCustomQuantity("1")
      setCustomPrice("")
      setShowCustomForm(false)
      toast.success("Artículo personalizado añadido")
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo añadir el artículo")
    },
  })

  const updateQtyMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      updateDraftItemQuantity(draftId, itemId, quantity),
    onSuccess: () => {
      invalidate()
      refresh()
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo actualizar la cantidad")
    },
  })

  const items = draft?.items ?? []
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <FocusModal open={open} onOpenChange={onOpenChange}>
      <FocusModal.Content className="!flex !max-h-[calc(100vh-2rem)] !max-w-[860px] !flex-col overflow-hidden">
        <StoreSettingsModalHeader
          title="Editar artículos"
          description="Añade productos del catálogo o artículos personalizados al borrador."
        />
        <FocusModal.Body className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="mx-auto flex w-full max-w-[720px] flex-col gap-y-6">
            <div className="overflow-hidden rounded-xl border border-ui-border-base">
              <div className="border-b border-ui-border-base px-5 py-4">
                <Text weight="plus">Artículos</Text>
                <Text size="small" className="text-ui-fg-subtle mt-1">
                  Elige productos del catálogo o añade un artículo personalizado.
                </Text>
              </div>

              <div className="flex flex-col gap-4 px-5 py-5">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MagnifyingGlass className="text-ui-fg-subtle absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      className="pl-9"
                      placeholder="Buscar artículos"
                      value={productQuery}
                      onChange={(event) => setProductQuery(event.target.value)}
                    />
                  </div>
                  <Button
                    size="small"
                    variant="secondary"
                    type="button"
                    onClick={() => setShowCustomForm((value) => !value)}
                  >
                    <Plus />
                  </Button>
                </div>

                {productQuery.trim().length >= 2 ? (
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-ui-border-base">
                    {productsQuery.isLoading ? (
                      <div className="px-3 py-4">
                        <Text size="small" className="text-ui-fg-subtle">
                          Buscando…
                        </Text>
                      </div>
                    ) : variants.length ? (
                      variants.map((variant) => (
                        <button
                          key={variant.id}
                          type="button"
                          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-ui-bg-base-hover"
                          onClick={() => {
                            addVariantToDraft(draftId, variant.id, 1)
                              .then(() => {
                                invalidate()
                                refresh()
                                setProductQuery("")
                                toast.success("Producto añadido")
                              })
                              .catch((error: Error) => {
                                toast.error(
                                  error.message || "No se pudo añadir el producto"
                                )
                              })
                          }}
                        >
                          <Text size="small" weight="plus">
                            {variant.label}
                          </Text>
                          {variant.price != null && draft ? (
                            <Text size="small" className="text-ui-fg-subtle">
                              {formatDraftMoney(variant.price, draft.currency_code)}
                            </Text>
                          ) : null}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-4">
                        <Text size="small" className="text-ui-fg-subtle">
                          No se encontraron productos.
                        </Text>
                      </div>
                    )}
                  </div>
                ) : productQuery.trim().length > 0 ? (
                  <Text size="small" className="text-ui-fg-subtle">
                    Escribe al menos 2 caracteres para buscar.
                  </Text>
                ) : null}

                {showCustomForm ? (
                  <form
                    id={formId}
                    className="grid gap-3 rounded-lg border border-dashed border-ui-border-base p-4 sm:grid-cols-2"
                    onSubmit={(event) => {
                      event.preventDefault()
                      addCustomMutation.mutate()
                    }}
                  >
                    <div className="flex flex-col gap-y-2 sm:col-span-2">
                      <Label>Título del artículo</Label>
                      <Input
                        value={customTitle}
                        placeholder="Artículo personalizado"
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
                      <Label>
                        Precio ({draft?.currency_code?.toUpperCase() ?? "EUR"})
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={customPrice}
                        onChange={(event) => setCustomPrice(event.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Button
                        size="small"
                        type="submit"
                        disabled={!customTitle.trim() || !customPrice}
                        isLoading={addCustomMutation.isPending}
                      >
                        Añadir artículo personalizado
                      </Button>
                    </div>
                  </form>
                ) : null}
              </div>

              {items.length ? (
                <div className="border-t border-ui-border-base">
                  <div className="grid grid-cols-[1fr_80px_100px_40px] gap-3 border-b border-ui-border-base bg-ui-bg-subtle px-5 py-2 text-xs font-medium text-ui-fg-subtle">
                    <span>Artículo</span>
                    <span className="text-right">Cantidad</span>
                    <span className="text-right">Precio</span>
                    <span />
                  </div>
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[1fr_80px_100px_40px] items-center gap-3 border-b border-ui-border-base px-5 py-3 last:border-0"
                    >
                      <div>
                        <Text size="small" weight="plus">
                          {item.title}
                        </Text>
                        {!item.variant_id ? (
                          <Badge size="2xsmall" color="grey" className="mt-1">
                            Personalizado
                          </Badge>
                        ) : null}
                      </div>
                      <Input
                        className="text-right"
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
                      <Text size="small" className="text-right">
                        {draft
                          ? formatDraftMoney(
                              item.unit_price * item.quantity,
                              draft.currency_code
                            )
                          : "—"}
                      </Text>
                      <Button
                        size="small"
                        variant="transparent"
                        type="button"
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
                  ))}
                </div>
              ) : (
                <div className="border-t border-ui-border-base px-5 py-8 text-center">
                  <Text size="small" className="text-ui-fg-subtle">
                    Aún no hay artículos en este borrador.
                  </Text>
                </div>
              )}
            </div>
          </div>
        </FocusModal.Body>
        <FocusModal.Footer>
          <div className="flex w-full items-center justify-between gap-3">
            <div>
              <Text size="small" className="text-ui-fg-subtle">
                Subtotal
              </Text>
              <Text weight="plus">
                {draft
                  ? `${itemCount} ${itemCount === 1 ? "artículo" : "artículos"} · ${formatDraftMoney(draft.subtotal ?? 0, draft.currency_code)}`
                  : "—"}
              </Text>
            </div>
            <FocusModal.Close asChild>
              <Button size="small" type="button">
                Listo
              </Button>
            </FocusModal.Close>
          </div>
        </FocusModal.Footer>
      </FocusModal.Content>
    </FocusModal>
  )
}
