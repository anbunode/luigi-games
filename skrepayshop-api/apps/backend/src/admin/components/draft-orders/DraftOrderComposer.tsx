import {
  Button,
  Container,
  FocusModal,
  Heading,
  Input,
  Label,
  Select,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FormEvent, useEffect, useMemo, useState, type ReactNode } from "react"
import {
  addDraftOrderItems,
  convertDraftOrderToOrder,
  customerLabel,
  deleteDraftOrder,
  fetchCustomersForDraft,
  fetchDraftOrder,
  fetchStoreOrderTags,
  formatMoney,
  parseMoneyInput,
  resolveVariantUnitPrice,
  searchProductsForDraft,
  updateDraftOrder,
  updateDraftOrderItem,
  type CustomerOption,
  type DraftOrderRow,
  type ProductOption,
} from "../../lib/draft-orders-api"

type DraftOrderComposerProps = {
  draftId: string
}

function SidebarCard({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="bg-ui-bg-base rounded-lg border p-4">
      <Heading level="h3" className="mb-3 text-sm">
        {title}
      </Heading>
      {children}
    </div>
  )
}

const DraftOrderComposer = ({ draftId }: DraftOrderComposerProps) => {
  const queryClient = useQueryClient()
  const [note, setNote] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [customerId, setCustomerId] = useState("")
  const [customerSearch, setCustomerSearch] = useState("")
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [customModalOpen, setCustomModalOpen] = useState(false)
  const [productQuery, setProductQuery] = useState("")
  const [customTitle, setCustomTitle] = useState("")
  const [customPrice, setCustomPrice] = useState("")
  const [customQuantity, setCustomQuantity] = useState("1")
  const [customWeight, setCustomWeight] = useState("")

  const draftQuery = useQuery({
    queryKey: ["skrepay", "draft-orders", "detail", draftId],
    queryFn: () => fetchDraftOrder(draftId),
    retry: 1,
  })

  const customersQuery = useQuery({
    queryKey: ["skrepay", "draft-orders", "customers", customerSearch],
    queryFn: () => fetchCustomersForDraft(customerSearch),
  })

  const customerCountQuery = useQuery({
    queryKey: ["skrepay", "draft-orders", "customers-count"],
    queryFn: () => fetchCustomersForDraft(""),
  })

  const tagsQuery = useQuery({
    queryKey: ["skrepay", "draft-orders", "store-tags"],
    queryFn: fetchStoreOrderTags,
  })

  const productsQuery = useQuery({
    queryKey: ["skrepay", "draft-orders", "products", productQuery],
    queryFn: () => searchProductsForDraft(productQuery),
    enabled: productModalOpen,
  })

  const draft = draftQuery.data?.draft_order
  const currency = draft?.currency_code ?? draft?.region?.currency_code ?? "EUR"
  const items = draft?.items ?? []
  const customers = customersQuery.data?.customers ?? []
  const hasCustomers = (customerCountQuery.data?.count ?? 0) > 0
  const storeTags = tagsQuery.data ?? []
  const hasTags = storeTags.length > 0

  useEffect(() => {
    if (!draft) {
      return
    }

    const metadata = draft.metadata ?? {}
    setNote(typeof metadata.note === "string" ? metadata.note : "")
    setSelectedTags(
      Array.isArray(metadata.tags)
        ? metadata.tags.filter((tag): tag is string => typeof tag === "string")
        : []
    )
    setCustomerId(draft.customer_id ?? draft.customer?.id ?? "")
  }, [draft?.id, draft?.metadata, draft?.customer_id, draft?.customer?.id])

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: ["skrepay", "draft-orders", "detail", draftId],
    })
    void queryClient.invalidateQueries({ queryKey: ["skrepay", "draft-orders", "list"] })
  }

  const metadataMutation = useMutation({
    mutationFn: () => {
      const selectedCustomer = customers.find((customer) => customer.id === customerId)

      return updateDraftOrder(draftId, {
        customer_id: customerId || undefined,
        email: selectedCustomer?.email ?? draft?.email,
        metadata: {
          ...(draft?.metadata ?? {}),
          note: note.trim() || undefined,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
        },
      })
    },
    onSuccess: () => {
      toast.success("Borrador actualizado")
      invalidate()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar")
    },
  })

  const addProductMutation = useMutation({
    mutationFn: (input: {
      variant_id: string
      quantity: number
      unit_price: number
      title?: string
    }) => addDraftOrderItems(draftId, [input]),
    onSuccess: () => {
      toast.success("Producto agregado")
      setProductModalOpen(false)
      invalidate()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo agregar el producto")
    },
  })

  const addCustomMutation = useMutation({
    mutationFn: (input: {
      title: string
      quantity: number
      unit_price: number
      metadata?: Record<string, unknown>
    }) => addDraftOrderItems(draftId, [input]),
    onSuccess: () => {
      toast.success("Artículo agregado")
      setCustomModalOpen(false)
      setCustomTitle("")
      setCustomPrice("")
      setCustomQuantity("1")
      setCustomWeight("")
      invalidate()
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "No se pudo agregar el artículo"
      )
    },
  })

  const updateItemMutation = useMutation({
    mutationFn: (input: { itemId: string; quantity: number }) =>
      updateDraftOrderItem(draftId, input.itemId, { quantity: input.quantity }),
    onSuccess: () => invalidate(),
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar")
    },
  })

  const convertMutation = useMutation({
    mutationFn: () => convertDraftOrderToOrder(draftId),
    onSuccess: (result) => {
      toast.success("Borrador convertido en pedido")
      const orderId = result.order?.id
      if (orderId) {
        window.location.assign(`/app/orders/${orderId}`)
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo convertir")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteDraftOrder(draftId),
    onSuccess: () => {
      toast.success("Borrador eliminado")
      window.location.assign("/app/draft-orders")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar")
    },
  })

  const productRows = useMemo(() => {
    const rows: Array<{
      product: ProductOption
      variant: NonNullable<ProductOption["variants"]>[number]
    }> = []

    for (const product of productsQuery.data ?? []) {
      for (const variant of product.variants ?? []) {
        rows.push({
          product,
          variant: {
            ...variant,
            product: { id: product.id, title: product.title, thumbnail: product.thumbnail },
          },
        })
      }
    }

    return rows
  }, [productsQuery.data])

  const handleSaveMetadata = (event: FormEvent) => {
    event.preventDefault()
    metadataMutation.mutate()
  }

  const handleAddCustom = (event: FormEvent) => {
    event.preventDefault()

    const quantity = Number(customQuantity)
    const unitPrice = parseMoneyInput(customPrice)

    if (!customTitle.trim()) {
      toast.error("Indica el nombre del artículo")
      return
    }

    if (!Number.isFinite(quantity) || quantity < 1) {
      toast.error("Cantidad inválida")
      return
    }

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      toast.error("Precio inválido")
      return
    }

    const metadata =
      customWeight.trim() !== ""
        ? { weight: Number(customWeight) || customWeight.trim() }
        : undefined

    addCustomMutation.mutate({
      title: customTitle.trim(),
      quantity,
      unit_price: unitPrice,
      metadata,
    })
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((value) => value !== tag) : [...current, tag]
    )
  }

  if (draftQuery.isLoading) {
    return (
      <Container className="p-6">
        <Text className="text-ui-fg-subtle">Cargando borrador…</Text>
      </Container>
    )
  }

  if (draftQuery.isError || !draft) {
    return (
      <Container className="p-6">
        <Text className="text-ui-fg-error">No se pudo cargar el borrador.</Text>
      </Container>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Heading>Borrador #{draft.display_id ?? "—"}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {draft.region?.name ?? "Sin región"} · {currency.toUpperCase()}
          </Text>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="small" variant="secondary" asChild>
            <a href="/app/draft-orders">Volver</a>
          </Button>
          <Button
            size="small"
            isLoading={convertMutation.isPending}
            onClick={() => convertMutation.mutate()}
          >
            Convertir en pedido
          </Button>
          <Button
            size="small"
            variant="danger"
            isLoading={deleteMutation.isPending}
            onClick={() => {
              if (window.confirm("¿Eliminar este borrador?")) {
                deleteMutation.mutate()
              }
            }}
          >
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-4">
          <div className="bg-ui-bg-base rounded-lg border p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <Heading level="h2">Productos</Heading>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="small"
                  variant="secondary"
                  onClick={() => setProductModalOpen(true)}
                >
                  Agregar un producto
                </Button>
                <Button
                  size="small"
                  variant="secondary"
                  onClick={() => setCustomModalOpen(true)}
                >
                  Agregar un artículo personalizado
                </Button>
              </div>
            </div>

            {items.length === 0 ? (
              <Text className="text-ui-fg-subtle">
                Aún no hay productos en este borrador.
              </Text>
            ) : (
              <div className="flex flex-col gap-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 last:border-b-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <Text weight="plus">{item.title ?? "Artículo"}</Text>
                      <Text size="small" className="text-ui-fg-subtle">
                        {formatMoney(item.unit_price, currency)} c/u
                      </Text>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        className="w-20"
                        value={item.quantity ?? 1}
                        onChange={(event) => {
                          const quantity = Number(event.target.value)
                          if (quantity > 0) {
                            updateItemMutation.mutate({
                              itemId: item.id,
                              quantity,
                            })
                          }
                        }}
                      />
                      <Text weight="plus" className="min-w-[80px] text-right">
                        {formatMoney(item.subtotal ?? (item.unit_price ?? 0) * (item.quantity ?? 1), currency)}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-ui-bg-base rounded-lg border p-4">
            <Heading level="h2" className="mb-4">
              Pago
            </Heading>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <Text className="text-ui-fg-subtle">
                  Subtotal · {items.length} artículo{items.length === 1 ? "" : "s"}
                </Text>
                <Text>{formatMoney(draft.subtotal, currency)}</Text>
              </div>
              <div className="flex justify-between">
                <Text className="text-ui-fg-subtle">Envío</Text>
                <Text>{formatMoney(draft.shipping_total, currency)}</Text>
              </div>
              <div className="flex justify-between">
                <Text className="text-ui-fg-subtle">Impuesto estimado</Text>
                <Text>{formatMoney(draft.tax_total, currency)}</Text>
              </div>
              <div className="flex justify-between border-t pt-2">
                <Text weight="plus">Total</Text>
                <Text weight="plus">{formatMoney(draft.total, currency)}</Text>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button size="small" variant="secondary" type="button">
                Enviar factura
              </Button>
              <Button
                size="small"
                type="button"
                isLoading={convertMutation.isPending}
                onClick={() => convertMutation.mutate()}
              >
                Marcar como pagado
              </Button>
            </div>
          </div>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSaveMetadata}>
          <SidebarCard title="Notas">
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Sin notas"
              rows={4}
            />
          </SidebarCard>

          {hasCustomers ? (
            <SidebarCard title="Cliente">
              <div className="flex flex-col gap-2">
                <Input
                  value={customerSearch}
                  onChange={(event) => setCustomerSearch(event.target.value)}
                  placeholder="Busca o crea un cliente"
                />
                <Select
                  value={customerId || undefined}
                  onValueChange={setCustomerId}
                >
                  <Select.Trigger>
                    <Select.Value placeholder="Seleccionar cliente" />
                  </Select.Trigger>
                  <Select.Content>
                    {customers.map((customer: CustomerOption) => (
                      <Select.Item key={customer.id} value={customer.id}>
                        {customerLabel(customer)}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>
            </SidebarCard>
          ) : null}

          <SidebarCard title="Región">
            <Text weight="plus">{draft.region?.name ?? "—"}</Text>
            <Text size="small" className="text-ui-fg-subtle">
              Moneda: {currency.toUpperCase()}
            </Text>
          </SidebarCard>

          {hasTags ? (
            <SidebarCard title="Etiquetas">
              <div className="flex flex-wrap gap-2">
                {storeTags.map((tag) => {
                  const active = selectedTags.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        active
                          ? "bg-ui-bg-interactive text-ui-fg-on-color border-ui-border-interactive"
                          : "bg-ui-bg-subtle text-ui-fg-subtle"
                      }`}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>
            </SidebarCard>
          ) : null}

          <Button
            type="submit"
            size="small"
            variant="secondary"
            isLoading={metadataMutation.isPending}
          >
            Guardar cambios
          </Button>
        </form>
      </div>

      <FocusModal open={productModalOpen} onOpenChange={setProductModalOpen}>
        <FocusModal.Content>
          <FocusModal.Header>
            <Heading level="h2">Agregar producto</Heading>
          </FocusModal.Header>
          <FocusModal.Body className="flex flex-col gap-4 p-6">
            <Input
              value={productQuery}
              onChange={(event) => setProductQuery(event.target.value)}
              placeholder="Buscar productos"
            />
            {productsQuery.isLoading ? (
              <Text className="text-ui-fg-subtle">Cargando productos…</Text>
            ) : productRows.length === 0 ? (
              <Text className="text-ui-fg-subtle">No hay productos disponibles.</Text>
            ) : (
              <div className="flex max-h-[420px] flex-col gap-2 overflow-y-auto">
                {productRows.map(({ product, variant }) => {
                  const unitPrice = resolveVariantUnitPrice(variant, currency)

                  return (
                    <button
                      key={variant.id}
                      type="button"
                      className="hover:bg-ui-bg-subtle-hover flex items-center justify-between rounded-md border px-3 py-2 text-left"
                      onClick={() => {
                        if (unitPrice == null) {
                          toast.error(
                            "Este producto no tiene precio para la moneda de la región. Edítalo en Productos o usa un artículo personalizado."
                          )
                          return
                        }

                        addProductMutation.mutate({
                          variant_id: variant.id,
                          quantity: 1,
                          unit_price: unitPrice,
                          title: `${product.title}${variant.title ? ` · ${variant.title}` : ""}`,
                        })
                      }}
                    >
                      <div>
                        <Text weight="plus">{product.title}</Text>
                        <Text size="small" className="text-ui-fg-subtle">
                          {variant.title ?? "Variante"}
                        </Text>
                      </div>
                      <Text size="small">
                        {unitPrice != null
                          ? formatMoney(unitPrice, currency)
                          : "Sin precio"}
                      </Text>
                    </button>
                  )
                })}
              </div>
            )}
          </FocusModal.Body>
        </FocusModal.Content>
      </FocusModal>

      <FocusModal open={customModalOpen} onOpenChange={setCustomModalOpen}>
        <FocusModal.Content>
          <FocusModal.Header>
            <Heading level="h2">Agregar artículo personalizado</Heading>
          </FocusModal.Header>
          <FocusModal.Body className="p-6">
            <form className="flex flex-col gap-4" onSubmit={handleAddCustom}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="custom-title">Nombre del artículo</Label>
                <Input
                  id="custom-title"
                  value={customTitle}
                  onChange={(event) => setCustomTitle(event.target.value)}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="custom-price">Precio</Label>
                  <Input
                    id="custom-price"
                    value={customPrice}
                    onChange={(event) => setCustomPrice(event.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="custom-qty">Cantidad</Label>
                  <Input
                    id="custom-qty"
                    type="number"
                    min={1}
                    value={customQuantity}
                    onChange={(event) => setCustomQuantity(event.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="custom-weight">Peso (opcional)</Label>
                <Input
                  id="custom-weight"
                  value={customWeight}
                  onChange={(event) => setCustomWeight(event.target.value)}
                  placeholder="g o kg"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  size="small"
                  variant="secondary"
                  onClick={() => setCustomModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="small"
                  isLoading={addCustomMutation.isPending}
                >
                  Agregar artículo
                </Button>
              </div>
            </form>
          </FocusModal.Body>
        </FocusModal.Content>
      </FocusModal>
    </div>
  )
}

export default DraftOrderComposer
