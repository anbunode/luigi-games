import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Button,
  Container,
  Heading,
  Table,
  Text,
  Tooltip,
  TooltipProvider,
} from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useNavigate, useSearchParams } from "react-router-dom"
import DraftOrderCreateForm from "../../components/orders/DraftOrderCreateForm"
import DraftOrderEmptyState from "../../components/orders/DraftOrderEmptyState"
import {
  fetchDraftOrders,
  formatDraftDate,
} from "../../lib/draft-orders-api"

const BorradoresPage = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const showCreate = searchParams.get("crear") === "1"

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["skrepay", "draft-orders", "list"],
    queryFn: () => fetchDraftOrders(),
    retry: 1,
  })

  const rows = data?.draft_orders ?? []
  const openCreate = () => setSearchParams({ crear: "1" })
  const closeCreate = () => setSearchParams({})

  return (
    <TooltipProvider>
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading>Borradores</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              Pedidos creados manualmente antes de convertirlos en orden real.
            </Text>
          </div>
          {!showCreate ? (
            <Button size="small" variant="secondary" onClick={openCreate}>
              Crear pedido
            </Button>
          ) : (
            <Button size="small" variant="secondary" onClick={closeCreate}>
              Volver al listado
            </Button>
          )}
        </div>

        {showCreate ? (
          <DraftOrderCreateForm onCancel={closeCreate} />
        ) : isLoading ? (
          <div className="px-6 py-10">
            <Text className="text-ui-fg-subtle">Cargando borradores…</Text>
          </div>
        ) : isError ? (
          <div className="flex flex-col gap-3 px-6 py-10">
            <Text className="text-ui-fg-error">
              No se pudieron cargar los borradores.
            </Text>
            <Text size="small" className="text-ui-fg-subtle">
              {error instanceof Error ? error.message : String(error)}
            </Text>
            <Button size="small" variant="secondary" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <DraftOrderEmptyState onCreateClick={openCreate} />
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
                    onClick={() => navigate(`/borradores/${row.id}`)}
                  >
                    <Table.Cell>#{row.display_id ?? "—"}</Table.Cell>
                    <Table.Cell>
                      {createdAt.full ? (
                        <Tooltip content={createdAt.full}>
                          <span>{createdAt.short}</span>
                        </Tooltip>
                      ) : (
                        createdAt.short
                      )}
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
    </TooltipProvider>
  )
}

export const config = defineRouteConfig({
  label: "Borradores",
  nested: "/orders",
  rank: 2,
})

export default BorradoresPage
