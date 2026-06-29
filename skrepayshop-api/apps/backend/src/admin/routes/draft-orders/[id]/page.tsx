import { Button, Container, Heading, Table, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useParams } from "react-router-dom"
import {
  convertDraftOrderToOrder,
  deleteDraftOrder,
  fetchDraftOrder,
  formatDraftDate,
  formatMoney,
} from "../../../lib/draft-orders-api"

const DraftOrderDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["skrepay", "draft-orders", "detail", id],
    queryFn: () => fetchDraftOrder(id!),
    enabled: Boolean(id),
    retry: 1,
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteDraftOrder(id!),
    onSuccess: () => {
      toast.success("Borrador eliminado")
      void queryClient.invalidateQueries({ queryKey: ["skrepay", "draft-orders"] })
      navigate("/draft-orders")
    },
    onError: (mutationError) => {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : "No se pudo eliminar el borrador"
      )
    },
  })

  const convertMutation = useMutation({
    mutationFn: () => convertDraftOrderToOrder(id!),
    onSuccess: (result) => {
      toast.success("Borrador convertido en pedido")
      void queryClient.invalidateQueries({ queryKey: ["skrepay", "draft-orders"] })
      const orderId = result.order?.id
      if (orderId) {
        navigate(`/orders/${orderId}`)
      } else {
        navigate("/draft-orders")
      }
    },
    onError: (mutationError) => {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : "No se pudo convertir el borrador"
      )
    },
  })

  const draft = data?.draft_order
  const createdAt = formatDraftDate(draft?.created_at)
  const items = draft?.items ?? []

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div>
          <Heading>Borrador #{draft?.display_id ?? "—"}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {draft?.email ?? "Sin email"}
            {createdAt.full ? ` · ${createdAt.full}` : ""}
          </Text>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="small"
            variant="secondary"
            onClick={() => navigate("/draft-orders")}
          >
            Volver
          </Button>
          <Button
            size="small"
            variant="secondary"
            isLoading={convertMutation.isPending}
            disabled={!draft || isLoading || isError}
            onClick={() => convertMutation.mutate()}
          >
            Convertir en pedido
          </Button>
          <Button
            size="small"
            variant="danger"
            isLoading={deleteMutation.isPending}
            disabled={!draft || isLoading || isError}
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

      {isLoading ? (
        <div className="px-6 py-10">
          <Text className="text-ui-fg-subtle">Cargando borrador…</Text>
        </div>
      ) : isError ? (
        <div className="flex flex-col gap-3 px-6 py-10">
          <Text className="text-ui-fg-error">No se pudo cargar el borrador.</Text>
          <Text size="small" className="text-ui-fg-subtle">
            {error instanceof Error ? error.message : String(error)}
          </Text>
          <Button size="small" variant="secondary" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      ) : draft ? (
        <>
          <div className="grid gap-4 px-6 py-6 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <Text size="small" className="text-ui-fg-subtle">
                Región
              </Text>
              <Text weight="plus">{draft.region?.name ?? "—"}</Text>
            </div>
            <div>
              <Text size="small" className="text-ui-fg-subtle">
                Canal
              </Text>
              <Text weight="plus">{draft.sales_channel?.name ?? "—"}</Text>
            </div>
            <div>
              <Text size="small" className="text-ui-fg-subtle">
                Estado
              </Text>
              <Text weight="plus">{draft.status ?? "draft"}</Text>
            </div>
            <div>
              <Text size="small" className="text-ui-fg-subtle">
                Total
              </Text>
              <Text weight="plus">
                {formatMoney(draft.total, draft.currency_code)}
              </Text>
            </div>
          </div>

          <div className="px-6 py-6">
            <Heading level="h2" className="mb-4">
              Artículos
            </Heading>
            {items.length === 0 ? (
              <Text className="text-ui-fg-subtle">
                Este borrador aún no tiene productos.
              </Text>
            ) : (
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Producto</Table.HeaderCell>
                    <Table.HeaderCell>Cantidad</Table.HeaderCell>
                    <Table.HeaderCell>Precio</Table.HeaderCell>
                    <Table.HeaderCell>Subtotal</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {items.map((item) => (
                    <Table.Row key={item.id}>
                      <Table.Cell>{item.title ?? "—"}</Table.Cell>
                      <Table.Cell>{item.quantity ?? "—"}</Table.Cell>
                      <Table.Cell>
                        {formatMoney(item.unit_price, draft.currency_code)}
                      </Table.Cell>
                      <Table.Cell>
                        {formatMoney(item.subtotal, draft.currency_code)}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            )}
          </div>
        </>
      ) : null}
    </Container>
  )
}

export default DraftOrderDetailPage
