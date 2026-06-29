import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Select,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FormEvent, useEffect, useState } from "react"
import {
  createDraftOrder,
  customerLabel,
  fetchCustomersForDraft,
  fetchDraftOrders,
  fetchRegionsForDraft,
  fetchSalesChannelsForDraft,
  formatDraftDate,
} from "../../lib/draft-orders-api"

const DRAFT_ORDERS_PATH = "/draft-orders"

const DraftOrdersPage = () => {
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [email, setEmail] = useState("")
  const [customerId, setCustomerId] = useState("")
  const [customerSearch, setCustomerSearch] = useState("")
  const [regionId, setRegionId] = useState("")
  const [salesChannelId, setSalesChannelId] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("crear") === "1") {
      setShowCreate(true)
    }
  }, [])

  const listQuery = useQuery({
    queryKey: ["skrepay", "draft-orders", "list"],
    queryFn: () => fetchDraftOrders(),
    retry: 1,
  })

  const regionsQuery = useQuery({
    queryKey: ["skrepay", "draft-orders", "regions"],
    queryFn: fetchRegionsForDraft,
    enabled: showCreate,
  })

  const channelsQuery = useQuery({
    queryKey: ["skrepay", "draft-orders", "sales-channels"],
    queryFn: fetchSalesChannelsForDraft,
    enabled: showCreate,
  })

  const customerCountQuery = useQuery({
    queryKey: ["skrepay", "draft-orders", "customers-count"],
    queryFn: () => fetchCustomersForDraft(""),
    enabled: showCreate,
  })

  const customersQuery = useQuery({
    queryKey: ["skrepay", "draft-orders", "customers", customerSearch],
    queryFn: () => fetchCustomersForDraft(customerSearch),
    enabled: showCreate,
  })

  const createMutation = useMutation({
    mutationFn: createDraftOrder,
    onSuccess: (data) => {
      toast.success("Borrador creado")
      void queryClient.invalidateQueries({ queryKey: ["skrepay", "draft-orders"] })
      setShowCreate(false)
      window.location.assign(`/app${DRAFT_ORDERS_PATH}/${data.draft_order.id}`)
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "No se pudo crear el borrador"
      )
    },
  })

  const rows = listQuery.data?.draft_orders ?? []
  const regions = regionsQuery.data ?? []
  const channels = channelsQuery.data ?? []
  const customers = customersQuery.data?.customers ?? []
  const hasCustomers = (customerCountQuery.data?.count ?? 0) > 0

  const handleCreate = (event: FormEvent) => {
    event.preventDefault()

    if (!regionId) {
      toast.error("Selecciona una región")
      return
    }

    const selectedCustomer = customers.find((customer) => customer.id === customerId)

    if (!customerId && !email.trim()) {
      toast.error("Indica el email del cliente o selecciona un cliente")
      return
    }

    createMutation.mutate({
      region_id: regionId,
      ...(customerId
        ? { customer_id: customerId, email: selectedCustomer?.email }
        : { email: email.trim() }),
      ...(salesChannelId ? { sales_channel_id: salesChannelId } : {}),
    })
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Borradores</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Pedidos creados manualmente antes de convertirlos en orden real.
          </Text>
        </div>
        <Button
          size="small"
          variant="secondary"
          onClick={() => setShowCreate((value) => !value)}
        >
          {showCreate ? "Volver al listado" : "Crear pedido"}
        </Button>
      </div>

      {showCreate ? (
        <form className="flex flex-col gap-6 px-6 py-8" onSubmit={handleCreate}>
          {regionsQuery.isLoading ||
          channelsQuery.isLoading ||
          customerCountQuery.isLoading ? (
            <Text className="text-ui-fg-subtle">Cargando opciones…</Text>
          ) : regionsQuery.isError || channelsQuery.isError ? (
            <Text className="text-ui-fg-error">
              No se pudieron cargar regiones o canales de venta.
            </Text>
          ) : regions.length === 0 ? (
            <Text className="text-ui-fg-error">
              No hay regiones configuradas. Crea una región en Ajustes antes de
              crear borradores.
            </Text>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="draft-region">Región</Label>
                <Select
                  value={regionId || undefined}
                  onValueChange={setRegionId}
                >
                  <Select.Trigger id="draft-region">
                    <Select.Value placeholder="Seleccionar región" />
                  </Select.Trigger>
                  <Select.Content>
                    {regions.map((region) => (
                      <Select.Item key={region.id} value={region.id}>
                        {region.name}
                        {region.currency_code
                          ? ` (${region.currency_code.toUpperCase()})`
                          : ""}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>

              {hasCustomers ? (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="draft-customer">Cliente</Label>
                  <Input
                    id="draft-customer-search"
                    value={customerSearch}
                    onChange={(event) => setCustomerSearch(event.target.value)}
                    placeholder="Buscar cliente"
                  />
                  <Select
                    value={customerId || undefined}
                    onValueChange={(value) => {
                      setCustomerId(value)
                      const selected = customers.find(
                        (customer) => customer.id === value
                      )
                      if (selected?.email) {
                        setEmail(selected.email)
                      }
                    }}
                  >
                    <Select.Trigger id="draft-customer">
                      <Select.Value placeholder="Seleccionar cliente" />
                    </Select.Trigger>
                    <Select.Content>
                      {customers.map((customer) => (
                        <Select.Item key={customer.id} value={customer.id}>
                          {customerLabel(customer)}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="draft-email">Email del cliente</Label>
                  <Input
                    id="draft-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="cliente@ejemplo.com"
                  />
                </div>
              )}
            </>
          )}

          {channels.length > 0 ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="draft-channel">Canal de venta (opcional)</Label>
              <Select
                value={salesChannelId || undefined}
                onValueChange={setSalesChannelId}
              >
                <Select.Trigger id="draft-channel">
                  <Select.Value placeholder="Por defecto" />
                </Select.Trigger>
                <Select.Content>
                  {channels.map((channel) => (
                    <Select.Item key={channel.id} value={channel.id}>
                      {channel.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
          ) : null}

          <div className="flex gap-2">
            <Button
              type="submit"
              size="small"
              isLoading={createMutation.isPending}
              disabled={
                regionsQuery.isLoading ||
                channelsQuery.isLoading ||
                customerCountQuery.isLoading ||
                regionsQuery.isError ||
                channelsQuery.isError ||
                regions.length === 0
              }
            >
              Crear pedido
            </Button>
            <Button
              size="small"
              variant="secondary"
              type="button"
              onClick={() => setShowCreate(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      ) : listQuery.isLoading ? (
        <div className="px-6 py-10">
          <Text className="text-ui-fg-subtle">Cargando borradores…</Text>
        </div>
      ) : listQuery.isError ? (
        <div className="flex flex-col gap-3 px-6 py-10">
          <Text className="text-ui-fg-error">
            No se pudieron cargar los borradores.
          </Text>
          <Text size="small" className="text-ui-fg-subtle">
            {listQuery.error instanceof Error
              ? listQuery.error.message
              : String(listQuery.error)}
          </Text>
          <Button
            size="small"
            variant="secondary"
            onClick={() => listQuery.refetch()}
          >
            Reintentar
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          <Heading>Crea pedidos manualmente</Heading>
          <Text className="text-ui-fg-subtle max-w-md">
            Usa borradores para armar pedidos por teléfono, B2B o casos
            especiales antes de convertirlos en pedidos reales.
          </Text>
          <Button size="small" onClick={() => setShowCreate(true)}>
            Crear pedido
          </Button>
        </div>
      ) : (
        <div className="px-6 py-4">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-ui-fg-subtle">
                <th className="py-2 pr-4 font-medium">Pedido</th>
                <th className="py-2 pr-4 font-medium">Fecha</th>
                <th className="py-2 pr-4 font-medium">Cliente</th>
                <th className="py-2 pr-4 font-medium">Canal</th>
                <th className="py-2 pr-4 font-medium">Región</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const createdAt = formatDraftDate(row.created_at)

                return (
                  <tr
                    key={row.id}
                    className="border-b hover:bg-ui-bg-subtle-hover cursor-pointer"
                  >
                    <td className="py-3 pr-4">
                      <a
                        href={`/app${DRAFT_ORDERS_PATH}/${row.id}`}
                        className="text-ui-fg-interactive"
                      >
                        #{row.display_id ?? "—"}
                      </a>
                    </td>
                    <td className="py-3 pr-4" title={createdAt.full || undefined}>
                      {createdAt.short}
                    </td>
                    <td className="py-3 pr-4">
                      {row.customer?.email ?? row.email ?? "—"}
                    </td>
                    <td className="py-3 pr-4">
                      {row.sales_channel?.name ?? "—"}
                    </td>
                    <td className="py-3 pr-4">{row.region?.name ?? "—"}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Borradores",
  nested: "/orders",
  rank: 2,
})

export default DraftOrdersPage
