import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Select,
  Table,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Component, FormEvent, type ReactNode, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  createDraftOrder,
  fetchDraftOrders,
  fetchRegionsForDraft,
  fetchSalesChannelsForDraft,
  formatDraftDate,
} from "../../lib/draft-orders-api"

class DraftOrdersErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <Container className="p-6">
          <Text className="text-ui-fg-error">
            Error al mostrar borradores: {this.state.error.message}
          </Text>
        </Container>
      )
    }

    return this.props.children
  }
}

const DraftOrdersPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [email, setEmail] = useState("")
  const [regionId, setRegionId] = useState("")
  const [salesChannelId, setSalesChannelId] = useState("")

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

  const createMutation = useMutation({
    mutationFn: createDraftOrder,
    onSuccess: (data) => {
      toast.success("Borrador creado")
      void queryClient.invalidateQueries({ queryKey: ["skrepay", "draft-orders"] })
      setShowCreate(false)
      navigate(`/draft-orders/${data.draft_order.id}`)
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

  const handleCreate = (event: FormEvent) => {
    event.preventDefault()

    if (!regionId) {
      toast.error("Selecciona una región")
      return
    }

    if (!email.trim()) {
      toast.error("Indica el email del cliente")
      return
    }

    createMutation.mutate({
      region_id: regionId,
      email: email.trim(),
      ...(salesChannelId ? { sales_channel_id: salesChannelId } : {}),
    })
  }

  return (
    <DraftOrdersErrorBoundary>
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
            {regionsQuery.isLoading || channelsQuery.isLoading ? (
              <Text className="text-ui-fg-subtle">Cargando opciones…</Text>
            ) : regionsQuery.isError || channelsQuery.isError ? (
              <Text className="text-ui-fg-error">
                No se pudieron cargar regiones o canales de venta.
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
              </>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                size="small"
                isLoading={createMutation.isPending}
                disabled={
                  regionsQuery.isLoading ||
                  channelsQuery.isLoading ||
                  regionsQuery.isError ||
                  channelsQuery.isError
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
            <Heading level="h2">Crea pedidos manualmente</Heading>
            <Text className="text-ui-fg-subtle max-w-md">
              Usa borradores para armar pedidos por teléfono, B2B o casos
              especiales antes de convertirlos en pedidos reales.
            </Text>
            <Button size="small" onClick={() => setShowCreate(true)}>
              Crear pedido
            </Button>
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Pedido</Table.HeaderCell>
                <Table.HeaderCell>Fecha</Table.HeaderCell>
                <Table.HeaderCell>Cliente</Table.HeaderCell>
                <Table.HeaderCell>Canal</Table.HeaderCell>
                <Table.HeaderCell>Región</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {rows.map((row) => {
                const createdAt = formatDraftDate(row.created_at)

                return (
                  <Table.Row
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/draft-orders/${row.id}`)}
                  >
                    <Table.Cell>#{row.display_id ?? "—"}</Table.Cell>
                    <Table.Cell title={createdAt.full || undefined}>
                      {createdAt.short}
                    </Table.Cell>
                    <Table.Cell>
                      {row.customer?.email ?? row.email ?? "—"}
                    </Table.Cell>
                    <Table.Cell>{row.sales_channel?.name ?? "—"}</Table.Cell>
                    <Table.Cell>{row.region?.name ?? "—"}</Table.Cell>
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table>
        )}
      </Container>
    </DraftOrdersErrorBoundary>
  )
}

export const config = defineRouteConfig({
  label: "Borradores",
  nested: "/orders",
  rank: 2,
})

export default DraftOrdersPage
