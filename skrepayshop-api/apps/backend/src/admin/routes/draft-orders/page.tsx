import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"
import {
  fetchDraftOrders,
  formatDraftDate,
  type DraftOrderRow,
} from "../../lib/draft-orders-api"

const DRAFT_ORDERS_PATH = "/draft-orders"
const CREATE_PATH = `/app${DRAFT_ORDERS_PATH}/create`

function DraftOrderCard({ row }: { row: DraftOrderRow }) {
  const createdAt = formatDraftDate(row.created_at)
  const detailHref = `/app${DRAFT_ORDERS_PATH}/${row.id}`

  return (
    <a
      href={detailHref}
      className="bg-ui-bg-base hover:bg-ui-bg-subtle-hover block rounded-xl border p-4 shadow-borders-base transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Text weight="plus" className="text-ui-fg-interactive">
            #{row.display_id ?? "—"}
          </Text>
          <Text size="small" className="text-ui-fg-subtle mt-1 break-all">
            {row.customer?.email ?? row.email ?? "Sin cliente"}
          </Text>
        </div>
        <Text size="small" className="text-ui-fg-muted shrink-0" title={createdAt.full || undefined}>
          {createdAt.short}
        </Text>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <Text size="small" className="text-ui-fg-subtle">
          Canal: {row.sales_channel?.name ?? "—"}
        </Text>
        <Text size="small" className="text-ui-fg-subtle">
          Región: {row.region?.name ?? "—"}
        </Text>
      </div>
    </a>
  )
}

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
      <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <Heading>Borradores</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Pedidos creados manualmente antes de convertirlos en orden real.
          </Text>
        </div>
        <Button size="small" variant="secondary" className="w-full sm:w-auto" asChild>
          <a href={CREATE_PATH}>Crear pedido</a>
        </Button>
      </div>

      {listQuery.isLoading ? (
        <div className="px-4 py-10 sm:px-6">
          <Text className="text-ui-fg-subtle">Cargando borradores…</Text>
        </div>
      ) : listQuery.isError ? (
        <div className="flex flex-col gap-3 px-4 py-10 sm:px-6">
          <Text className="text-ui-fg-error">
            No se pudieron cargar los borradores.
          </Text>
          <Text size="small" className="text-ui-fg-subtle break-words">
            {listQuery.error instanceof Error
              ? listQuery.error.message
              : String(listQuery.error)}
          </Text>
          <Button
            size="small"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => listQuery.refetch()}
          >
            Reintentar
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 px-4 py-16 text-center sm:px-6">
          <Heading>Crea pedidos manualmente</Heading>
          <Text className="text-ui-fg-subtle max-w-md">
            Arma pedidos por teléfono, B2B o casos especiales con productos,
            notas, cliente y factura estimada antes de convertirlos en pedido.
          </Text>
          <Button size="small" className="w-full sm:w-auto" asChild>
            <a href={CREATE_PATH}>Crear pedido</a>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 px-4 py-4 md:hidden">
            {rows.map((row) => (
              <DraftOrderCard key={row.id} row={row} />
            ))}
          </div>

          <div className="hidden overflow-x-auto px-4 py-4 md:block sm:px-6">
            <table className="w-full min-w-[640px] text-left text-sm">
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
                      <td className="max-w-[200px] truncate py-3 pr-4">
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
        </>
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
