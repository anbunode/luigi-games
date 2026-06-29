import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"
import {
  fetchDraftOrders,
  formatDraftDate,
} from "../../lib/draft-orders-api"

const DRAFT_ORDERS_PATH = "/draft-orders"
const CREATE_PATH = `/app${DRAFT_ORDERS_PATH}/create`

const DraftOrdersPage = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("crear") === "1") {
      window.location.replace(CREATE_PATH)
    }
  }, [])

  const listQuery = useQuery({
    queryKey: ["skrepay", "draft-orders", "list"],
    queryFn: () => fetchDraftOrders(),
    retry: 1,
  })

  const rows = listQuery.data?.draft_orders ?? []

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Borradores</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Pedidos creados manualmente antes de convertirlos en orden real.
          </Text>
        </div>
        <Button size="small" variant="secondary" asChild>
          <a href={CREATE_PATH}>Crear pedido</a>
        </Button>
      </div>

      {listQuery.isLoading ? (
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
            Arma pedidos por teléfono, B2B o casos especiales con productos,
            notas, cliente y factura estimada antes de marcarlos como pagados.
          </Text>
          <Button size="small" asChild>
            <a href={CREATE_PATH}>Crear pedido</a>
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
