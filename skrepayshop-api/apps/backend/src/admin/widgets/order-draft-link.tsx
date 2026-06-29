import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Text } from "@medusajs/ui"

const DRAFT_ORDERS_HREF = "/app/draft-orders/create"

/**
 * CTA seguro en Pedidos: enlace HTML nativo, sin react-router.
 * Los widgets en order.list.before no deben usar Link/useNavigate.
 */
const OrderDraftLink = () => {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed px-4 py-3">
      <Text size="small" className="text-ui-fg-subtle">
        ¿Necesitas crear un pedido manualmente? Usa un borrador.
      </Text>
      <Button size="small" variant="secondary" asChild>
        <a href={DRAFT_ORDERS_HREF}>Crear pedido</a>
      </Button>
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "order.list.before",
})

export default OrderDraftLink
