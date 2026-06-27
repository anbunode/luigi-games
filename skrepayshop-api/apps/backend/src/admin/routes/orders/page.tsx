import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import { Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { EmptyStateCard } from "../../components/orders/EmptyStateCard"
import { OrdersEmptyIllustration } from "../../components/orders/illustrations"
import { OrdersDataTable } from "../../components/orders/OrdersDataTable"
import { fetchOrders, type AdminOrderRow } from "../../lib/orders-api"

function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrderRow[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    fetchOrders({ limit: 50 })
      .then((data) => {
        if (!active) return
        setOrders(data.orders ?? [])
        setCount(data.count ?? 0)
      })
      .catch((error) => {
        toast.error(
          error instanceof Error ? error.message : "Error al cargar pedidos"
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
          <Heading level="h1">Pedidos</Heading>
          {!isEmpty ? (
            <Button size="small" variant="secondary" asChild>
              <a href="/app/draft-orders/create">Crear pedido</a>
            </Button>
          ) : null}
        </div>
      </Container>

      {loading ? (
        <Container className="p-6">
          <Text className="text-ui-fg-subtle">Cargando pedidos…</Text>
        </Container>
      ) : isEmpty ? (
        <EmptyStateCard
          illustration={<OrdersEmptyIllustration />}
          title="Los pedidos se mostrarán aquí"
          description="Aquí prepararás pedidos, recaudarás pagos y harás seguimiento de su progreso."
          primaryAction={{
            label: "Crear pedido",
            to: "/draft-orders/create",
          }}
          footerLink={{
            label: "Más información sobre pedidos",
            href: "https://docs.medusajs.com/user-guide/orders",
          }}
        />
      ) : (
        <Container className="overflow-hidden p-0">
          <OrdersDataTable orders={orders} />
          {count > orders.length ? (
            <div className="border-t border-ui-border-base px-6 py-3">
              <Text size="small" className="text-ui-fg-subtle">
                Mostrando {orders.length} de {count} pedidos
              </Text>
            </div>
          ) : null}
        </Container>
      )}
    </div>
  )
}

export const config = defineRouteConfig({
  // No label to prevent duplicate sidebar extension
})

export default OrdersPage
