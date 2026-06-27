import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import { Container, Heading, Text, toast } from "@medusajs/ui"
import { EmptyStateCard } from "../../components/orders/EmptyStateCard"
import { DraftOrdersEmptyIllustration } from "../../components/orders/illustrations"
import { DraftOrdersDataTable } from "../../components/orders/OrdersDataTable"
import {
  fetchDraftOrders,
  type DraftOrderRow,
} from "../../lib/orders-api"

function DraftOrdersPage() {
  const [orders, setOrders] = useState<DraftOrderRow[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    fetchDraftOrders({ limit: 50 })
      .then((data) => {
        if (!active) return
        setOrders(data.draft_orders ?? [])
        setCount(data.count ?? 0)
      })
      .catch((error) => {
        toast.error(
          error instanceof Error ? error.message : "Error al cargar borradores"
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const isEmpty = !loading && count === 0

  return (
    <div className="flex flex-col gap-y-4">
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h1">Borradores</Heading>
        </div>
      </Container>

      {loading ? (
        <Container className="p-6">
          <Text className="text-ui-fg-subtle">Cargando borradores…</Text>
        </Container>
      ) : isEmpty ? (
        <EmptyStateCard
          illustration={<DraftOrdersEmptyIllustration />}
          title="Crea pedidos y facturas manualmente"
          description="Usa los pedidos preliminares para recibir pedidos por teléfono, enviar facturas por correo electrónico a los clientes y recaudar pagos."
          primaryAction={{
            label: "Crear pedido preliminar",
            to: "/draft-orders/create",
          }}
          footerLink={{
            label: "Más información sobre creación de pedidos preliminares",
            href: "https://docs.medusajs.com/user-guide/orders/draft-orders",
          }}
        />
      ) : (
        <Container className="overflow-hidden p-0">
          <DraftOrdersDataTable orders={orders} />
          {count > orders.length ? (
            <div className="border-t border-ui-border-base px-6 py-3">
              <Text size="small" className="text-ui-fg-subtle">
                Mostrando {orders.length} de {count} borradores
              </Text>
            </div>
          ) : null}
        </Container>
      )}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Borradores",
  nested: "/orders",
})

export default DraftOrdersPage
