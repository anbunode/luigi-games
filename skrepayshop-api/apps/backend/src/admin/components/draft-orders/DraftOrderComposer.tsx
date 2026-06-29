import {
  Button,
  Container,
  FocusModal,
  Heading,
  IconButton,
  Input,
  Label,
  Select,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { Plus, XMark } from "@medusajs/icons"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FormEvent, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import {
  addDraftOrderItems,
  convertDraftOrderToOrder,
  createDraftOrder,
  customerLabel,
  deleteDraftOrder,
  fetchCustomersForDraft,
  fetchDraftOrder,
  fetchRegionsForDraft,
  fetchStoreOrderTags,
  formatMoney,
  parseMoneyInput,
  resolveVariantUnitPrice,
  searchProductsForDraft,
  updateDraftOrder,
  updateDraftOrderItem,
  type CustomerOption,
  type ProductOption,
  type RegionOption,
} from "../../lib/draft-orders-api"

const PLACEHOLDER_EMAIL = "borrador@pendiente.local"

function resolveDraftEmail(
  customer: CustomerOption | undefined,
  guestEmail: string
) {
  return customer?.email || guestEmail.trim() || PLACEHOLDER_EMAIL
}

type DraftOrderComposerProps = {
  draftId?: string
  mode?: "create" | "edit"
}

function Panel({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="bg-ui-bg-base overflow-hidden rounded-xl border shadow-borders-base">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <Heading level="h2" className="text-base font-semibold">
          {title}
        </Heading>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

function SidebarPanel({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="bg-ui-bg-base overflow-hidden rounded-xl border shadow-borders-base">
      <div className="border-b px-4 py-3">
        <Heading level="h3" className="text-sm font-semibold">
          {title}
        </Heading>
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

function PaymentRow({
  label,
  hint,
  value,
  onClick,
  bold,
}: {
  label: ReactNode
  hint?: ReactNode
  value: string
  onClick?: () => void
  bold?: boolean
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-4 gap-y-1 py-1.5 text-sm">
      <div className="min-w-0">
        {onClick ? (
          <button
            type="button"
            onClick={onClick}
            className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover text-left"
          >
            {label}
          </button>
        ) : (
          <Text className={bold ? "font-semibold" : "text-ui-fg-subtle"}>
            {label}
          </Text>
        )}
      </div>
      <div className="text-ui-fg-muted text-right text-xs">{hint ?? "—"}</div>
      <Text className={`text-right ${bold ? "font-semibold" : ""}`}>{value}</Text>
    </div>
  )
}

const DraftOrderComposer = ({
  draftId: initialDraftId,
  mode = "edit",
}: DraftOrderComposerProps) => {
  const queryClient = useQueryClient()
  const isCreateMode = mode === "create"
  const [activeDraftId, setActiveDraftId] = useState<string | null>(
    initialDraftId ?? null
  )
  const [pendingRegionId, setPendingRegionId] = useState("")
  const [note, setNote] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [customerId, setCustomerId] = useState("")
  const [customerSearch, setCustomerSearch] = useState("")
  const [guestEmail, setGuestEmail] = useState("")
  const [payLater, setPayLater] = useState(false)
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [customModalOpen, setCustomModalOpen] = useState(false)
  const [productQuery, setProductQuery] = useState("")
  const [customTitle, setCustomTitle] = useState("")
  const [customPrice, setCustomPrice] = useState("")
  const [customQuantity, setCustomQuantity] = useState("1")
  const [customWeight, setCustomWeight] = useState("")
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const draftId = activeDraftId ?? initialDraftId

  const regionsQuery = useQuery({
    queryKey: ["skrepay", "draft-orders", "regions"],
    queryFn: fetchRegionsForDraft,
  })

  const draftQuery = useQuery({
    queryKey: ["skrepay", "draft-orders", "detail", draftId],
    queryFn: () => fetchDraftOrder(draftId!),
    enabled: Boolean(draftId),
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

  const regions = regionsQuery.data ?? []
  const draft = draftQuery.data?.draft_order
  const selectedRegion =
    regions.find((region) => region.id === (draft?.region?.id ?? pendingRegionId)) ??
    regions[0]
  const currency =
    draft?.currency_code ??
    draft?.region?.currency_code ??
    selectedRegion?.currency_code ??
    "EUR"
  const items = draft?.items ?? []
  const customers = customersQuery.data?.customers ?? []
  const hasCustomers = (customerCountQuery.data?.count ?? 0) > 0
  const storeTags = tagsQuery.data ?? []
  const hasTags = storeTags.length > 0
  const itemCount = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0)

  const taxRateLabel = useMemo(() => {
    const subtotal = draft?.subtotal ?? 0
    const tax = draft?.tax_total ?? 0
    if (!subtotal || !tax) {
      return "Impuesto"
    }
    const pct = Math.round((tax / subtotal) * 100)
    return `${pct}% IVA`
  }, [draft?.subtotal, draft?.tax_total])

  useEffect(() => {
    if (!isCreateMode || draftId || regions.length === 0) {
      return
    }

    if (!pendingRegionId) {
      setPendingRegionId(regions[0].id)
    }
  }, [isCreateMode, draftId, regions, pendingRegionId])

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
    setGuestEmail(draft.email ?? "")
    setPayLater(metadata.pay_later === true)
  }, [draft?.id, draft?.metadata, draft?.customer_id, draft?.customer?.id, draft?.email])

  const invalidate = () => {
    if (!draftId) {
      return
    }

    void queryClient.invalidateQueries({
      queryKey: ["skrepay", "draft-orders", "detail", draftId],
    })
    void queryClient.invalidateQueries({ queryKey: ["skrepay", "draft-orders", "list"] })
  }

  const createDraftMutation = useMutation({
    mutationFn: (input: { region_id: string; email?: string; customer_id?: string }) =>
      createDraftOrder(input),
    onSuccess: (data) => {
      const id = data.draft_order.id
      setActiveDraftId(id)
      if (isCreateMode) {
        window.history.replaceState(null, "", `/app/draft-orders/${id}`)
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo crear el borrador")
    },
  })

  const ensureDraft = async () => {
    if (draftId) {
      return draftId
    }

    const regionId = pendingRegionId || regions[0]?.id
    if (!regionId) {
      toast.error("Configura al menos una región antes de crear pedidos")
      return null
    }

    const selectedCustomer = customers.find((customer) => customer.id === customerId)
    const email = resolveDraftEmail(selectedCustomer, guestEmail)

    const result = await createDraftMutation.mutateAsync({
      region_id: regionId,
      email,
      ...(customerId ? { customer_id: customerId } : {}),
    })

    return result.draft_order.id
  }

  const metadataMutation = useMutation({
    mutationFn: async () => {
      const id = await ensureDraft()
      if (!id) {
        throw new Error("No se pudo crear el borrador")
      }

      const selectedCustomer = customers.find((customer) => customer.id === customerId)
      const email = resolveDraftEmail(selectedCustomer, guestEmail)

      return updateDraftOrder(id, {
        customer_id: customerId || undefined,
        email,
        region_id: pendingRegionId || draft?.region?.id,
        metadata: {
          ...(draft?.metadata ?? {}),
          note: note.trim() || undefined,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          pay_later: payLater || undefined,
        },
      })
    },
    onSuccess: () => invalidate(),
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar")
    },
  })

  const scheduleSave = () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = setTimeout(() => {
      metadataMutation.mutate()
    }, 700)
  }

  useEffect(() => {
    if (!draftId) {
      return
    }

    scheduleSave()

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note, selectedTags, customerId, guestEmail, payLater, pendingRegionId])

  const addProductMutation = useMutation({
    mutationFn: async (input: {
      variant_id: string
      quantity: number
      unit_price: number
      title?: string
    }) => {
      const id = await ensureDraft()
      if (!id) {
        throw new Error("Selecciona una región")
      }
      return addDraftOrderItems(id, [input])
    },
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
    mutationFn: async (input: {
      title: string
      quantity: number
      unit_price: number
      metadata?: Record<string, unknown>
    }) => {
      const id = await ensureDraft()
      if (!id) {
        throw new Error("Selecciona una región")
      }
      return addDraftOrderItems(id, [input])
    },
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
    mutationFn: (input: { itemId: string; quantity: number }) => {
      if (!draftId) {
        throw new Error("Borrador no disponible")
      }
      return updateDraftOrderItem(draftId, input.itemId, { quantity: input.quantity })
    },
    onSuccess: () => invalidate(),
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar")
    },
  })

  const convertMutation = useMutation({
    mutationFn: async () => {
      const id = await ensureDraft()
      if (!id) {
        throw new Error("No se pudo crear el borrador")
      }

      await metadataMutation.mutateAsync()
      return convertDraftOrderToOrder(id)
    },
    onSuccess: (result) => {
      toast.success("Pedido creado correctamente")
      const orderId = result.order?.id
      if (orderId) {
        window.location.assign(`/app/orders/${orderId}`)
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo crear el pedido")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!draftId) {
        throw new Error("Borrador no disponible")
      }
      return deleteDraftOrder(draftId)
    },
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
        rows.push({ product, variant })
      }
    }

    return rows
  }, [productsQuery.data])

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

  const handleRegionChange = (regionId: string) => {
    setPendingRegionId(regionId)

    if (draftId) {
      metadataMutation.mutate()
    }
  }

  const stubAction = (label: string) => {
    toast.info(`${label} estará disponible próximamente`)
  }

  if (regionsQuery.isLoading || (draftId && draftQuery.isLoading)) {
    return (
      <Container className="p-6">
        <Text className="text-ui-fg-subtle">Cargando…</Text>
      </Container>
    )
  }

  if (regions.length === 0) {
    return (
      <Container className="p-6">
        <Text className="text-ui-fg-error">
          No hay regiones configuradas. Crea una región en Ajustes antes de crear
          pedidos.
        </Text>
      </Container>
    )
  }

  if (draftId && draftQuery.isError) {
    return (
      <Container className="p-6">
        <Text className="text-ui-fg-error">No se pudo cargar el borrador.</Text>
      </Container>
    )
  }

  const pageTitle = isCreateMode
    ? "Crear pedido"
    : `Borrador #${draft?.display_id ?? "—"}`

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Heading>{pageTitle}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {selectedRegion?.name ?? "Selecciona región"} · {currency.toUpperCase()}
          </Text>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="small" variant="secondary" asChild>
            <a href="/app/draft-orders">Volver al listado</a>
          </Button>
          {!isCreateMode && draftId ? (
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
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex flex-col gap-4">
          <Panel
            title="Productos"
            action={
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="small"
                  variant="secondary"
                  onClick={() => setProductModalOpen(true)}
                >
                  <Plus className="mr-1" />
                  Agregar producto
                </Button>
                <Button
                  size="small"
                  variant="secondary"
                  onClick={() => setCustomModalOpen(true)}
                >
                  <Plus className="mr-1" />
                  Agregar artículo personalizado
                </Button>
              </div>
            }
          >
            {items.length === 0 ? (
              <div className="text-ui-fg-subtle rounded-lg border border-dashed px-4 py-10 text-center text-sm">
                Busca y agrega productos, o crea un artículo personalizado.
              </div>
            ) : (
              <div className="flex flex-col divide-y">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="bg-ui-bg-subtle flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Text size="small" className="text-ui-fg-muted">
                          —
                        </Text>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Text weight="plus" className="line-clamp-2">
                        {item.title ?? "Artículo"}
                      </Text>
                      <Text size="small" className="text-ui-fg-interactive">
                        {formatMoney(item.unit_price, currency)}
                      </Text>
                    </div>
                    <Input
                      type="number"
                      min={1}
                      className="w-20"
                      value={item.quantity ?? 1}
                      onChange={(event) => {
                        const quantity = Number(event.target.value)
                        if (quantity > 0 && draftId) {
                          updateItemMutation.mutate({
                            itemId: item.id,
                            quantity,
                          })
                        }
                      }}
                    />
                    <Text weight="plus" className="min-w-[88px] text-right">
                      {formatMoney(
                        item.subtotal ??
                          (item.unit_price ?? 0) * (item.quantity ?? 1),
                        currency
                      )}
                    </Text>
                    <IconButton
                      size="small"
                      variant="transparent"
                      type="button"
                      onClick={() => stubAction("Eliminar artículo")}
                    >
                      <XMark />
                    </IconButton>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Pago">
            <div className="flex flex-col">
              <PaymentRow
                label="Subtotal"
                hint={`${itemCount} artículo${itemCount === 1 ? "" : "s"}`}
                value={formatMoney(draft?.subtotal ?? 0, currency)}
              />
              <PaymentRow
                label="Agregar descuento"
                value={formatMoney(draft?.discount_total ?? 0, currency)}
                onClick={() => stubAction("Agregar descuento")}
              />
              <PaymentRow
                label="Agregar envío o entrega"
                value={formatMoney(draft?.shipping_total ?? 0, currency)}
                onClick={() => stubAction("Agregar envío")}
              />
              <PaymentRow
                label="Impuesto estimado"
                hint={taxRateLabel}
                value={formatMoney(draft?.tax_total ?? 0, currency)}
                onClick={() => stubAction("Impuesto estimado")}
              />
              <div className="mt-2 border-t pt-2">
                <PaymentRow
                  label="Total"
                  value={formatMoney(draft?.total ?? 0, currency)}
                  bold
                />
              </div>
            </div>

            <label className="mt-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={payLater}
                onChange={(event) => setPayLater(event.target.checked)}
                className="rounded border"
              />
              <span>Pago con vencimiento posterior</span>
            </label>

            <div className="mt-4 flex justify-end gap-2">
              <Button
                size="small"
                variant="secondary"
                type="button"
                onClick={() => stubAction("Enviar factura")}
              >
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
          </Panel>
        </div>

        <aside className="flex flex-col gap-4">
          <SidebarPanel title="Notas">
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Sin notas"
              rows={4}
              className="resize-none"
            />
          </SidebarPanel>

          {hasCustomers ? (
            <SidebarPanel title="Cliente">
              <div className="flex flex-col gap-2">
                <Input
                  value={customerSearch}
                  onChange={(event) => setCustomerSearch(event.target.value)}
                  placeholder="Busca o crea un cliente"
                />
                <Select
                  value={customerId || undefined}
                  onValueChange={(value) => {
                    setCustomerId(value)
                    const selected = customers.find((customer) => customer.id === value)
                    if (selected?.email) {
                      setGuestEmail(selected.email)
                    }
                  }}
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
            </SidebarPanel>
          ) : null}

          <SidebarPanel title="Región">
            <div className="flex flex-col gap-3">
              <Select
                value={pendingRegionId || draft?.region?.id || regions[0]?.id}
                onValueChange={handleRegionChange}
              >
                <Select.Trigger>
                  <Select.Value placeholder="Seleccionar región" />
                </Select.Trigger>
                <Select.Content>
                  {regions.map((region: RegionOption) => (
                    <Select.Item key={region.id} value={region.id}>
                      {region.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
              <div className="flex flex-col gap-1">
                <Label className="text-ui-fg-subtle text-xs">Moneda</Label>
                <Select value={currency} disabled>
                  <Select.Trigger>
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value={currency}>
                      {currency.toUpperCase()}
                    </Select.Item>
                  </Select.Content>
                </Select>
              </div>
            </div>
          </SidebarPanel>

          {hasTags ? (
            <SidebarPanel title="Etiquetas">
              <div className="flex flex-wrap gap-2">
                {storeTags.map((tag) => {
                  const active = selectedTags.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        active
                          ? "bg-ui-bg-interactive text-ui-fg-on-color border-ui-border-interactive"
                          : "bg-ui-bg-subtle text-ui-fg-subtle hover:bg-ui-bg-subtle-hover"
                      }`}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>
            </SidebarPanel>
          ) : null}

          {!hasCustomers ? (
            <SidebarPanel title="Email del cliente">
              <Input
                type="email"
                value={guestEmail}
                onChange={(event) => setGuestEmail(event.target.value)}
                placeholder="cliente@ejemplo.com"
              />
            </SidebarPanel>
          ) : null}
        </aside>
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
                      className="hover:bg-ui-bg-subtle-hover flex items-center gap-3 rounded-md border px-3 py-2 text-left"
                      onClick={() => {
                        if (unitPrice == null) {
                          toast.error(
                            "Este producto no tiene precio para la moneda de la región."
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
                      <div className="bg-ui-bg-subtle flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded border">
                        {product.thumbnail ? (
                          <img
                            src={product.thumbnail}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
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
