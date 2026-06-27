import { useEffect, useState } from "react"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ShoppingCart } from "@medusajs/icons"
import { Container, Heading, Text, toast } from "@medusajs/ui"
import { EmptyStateCard } from "../../components/orders/EmptyStateCard"
import { AbandonedCheckoutIllustration } from "../../components/orders/illustrations"
import { AbandonedCartsDataTable } from "../../components/orders/OrdersDataTable"
import {
  fetchAbandonedCarts,
  type AbandonedCartRow,
} from "../../lib/abandoned-carts-api"

function AbandonedCheckoutsPage() {
  const [carts, setCarts] = useState<AbandonedCartRow[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    fetchAbandonedCarts({ limit: 50 })
      .then((data) => {
        if (!active) return
        setCarts(data.abandoned_carts ?? [])
        setCount(data.count ?? 0)
      })
      .catch((error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Error al cargar carritos abandonados"
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
          <Heading level="h1">Pedidos abandonados</Heading>
        </div>
      </Container>

      {loading ? (
        <Container className="p-6">
          <Text className="text-ui-fg-subtle">Cargando carritos…</Text>
        </Container>
      ) : isEmpty ? (
        <EmptyStateCard
          illustration={<AbandonedCheckoutIllustration />}
          title="Los pedidos abandonados aparecerán aquí"
          description="Consulta cuándo los clientes agregan un artículo al carrito pero no pagan. También puedes enviar a los clientes un correo electrónico con un enlace a su carrito."
          secondaryPanel={{
            title: "Recupera ventas con el correo de carrito abandonado",
            description:
              "Configura notificaciones automáticas para recordar a los clientes que completen su compra.",
            action: {
              label: "Revisar notificaciones",
              to: "/settings/notifications",
            },
          }}
          footerLink={{
            label: "Más información sobre pedidos abandonados",
            href: "https://docs.medusajs.com/resources/commerce-modules/cart",
          }}
        />
      ) : (
        <Container className="overflow-hidden p-0">
          <AbandonedCartsDataTable carts={carts} />
          {count > carts.length ? (
            <div className="border-t border-ui-border-base px-6 py-3">
              <Text size="small" className="text-ui-fg-subtle">
                Mostrando {carts.length} de {count} carritos abandonados
              </Text>
            </div>
          ) : null}
        </Container>
      )}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Pedidos abandonados",
  nested: "/orders",
  rank: 3,
})

export default AbandonedCheckoutsPage
