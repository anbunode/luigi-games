import { Badge, Button, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useLayoutEffect } from "react"
import { DraftOrdersShell, DraftPanelCard } from "./DraftOrdersShell"
import {
  fetchDraftOrders,
  formatDraftDate,
  formatDraftMoney,
} from "../../lib/draft-orders-api"
import { installAuthBridge } from "../../lib/auth-bridge"

export function DraftOrdersListPage() {
  useLayoutEffect(() => {
    installAuthBridge()
  }, [])

  const draftsQuery = useQuery({
    queryKey: ["skrepay", "draft-orders", "list"],
    queryFn: fetchDraftOrders,
    retry: 1,
  })

  const drafts = draftsQuery.data ?? []

  return (
    <DraftOrdersShell
      title="Borradores"
      description="Pedidos manuales antes de convertirlos en pedidos reales."
      actions={
        <Button size="small" variant="secondary" asChild>
          <a href="/app/draft-orders/create">Crear borrador</a>
        </Button>
      }
    >
      {draftsQuery.isLoading ? (
        <DraftPanelCard>
          <div className="px-5 py-8">
            <Text className="text-ui-fg-subtle">Cargando borradores…</Text>
          </div>
        </DraftPanelCard>
      ) : draftsQuery.isError ? (
        <DraftPanelCard>
          <div className="px-5 py-8">
            <Text className="text-ui-fg-error">
              {(draftsQuery.error as Error)?.message ??
                "No se pudieron cargar los borradores."}
            </Text>
          </div>
        </DraftPanelCard>
      ) : drafts.length === 0 ? (
        <DraftPanelCard>
          <div className="px-5 py-10 text-center">
            <Text weight="plus">Aún no hay borradores</Text>
            <Text size="small" className="text-ui-fg-subtle mt-2">
              Crea uno para armar un pedido manual y convertirlo cuando esté listo.
            </Text>
          </div>
        </DraftPanelCard>
      ) : (
        <DraftPanelCard>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ui-border-base bg-ui-bg-subtle">
                <tr>
                  <th className="px-5 py-3 font-medium">Pedido</th>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Región</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {drafts.map((draft) => (
                  <tr
                    key={draft.id}
                    className="border-b border-ui-border-base last:border-0 hover:bg-ui-bg-base-hover"
                  >
                    <td className="px-5 py-4">
                      <a
                        href={`/app/draft-orders/${draft.id}`}
                        className="text-ui-fg-interactive font-medium hover:underline"
                      >
                        #{draft.display_id}
                      </a>
                    </td>
                    <td className="px-5 py-4">
                      {draft.customer?.email ?? draft.email ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      {draft.region?.name ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      {formatDraftMoney(draft.total ?? 0, draft.currency_code)}
                    </td>
                    <td className="px-5 py-4">
                      {formatDraftDate(draft.created_at)}
                    </td>
                    <td className="px-5 py-4">
                      <Badge size="2xsmall" color="grey">
                        {draft.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DraftPanelCard>
      )}
    </DraftOrdersShell>
  )
}
