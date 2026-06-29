import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Text } from "@medusajs/ui"
import { Link } from "react-router-dom"

const OrderCreateDraftCta = () => {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed px-4 py-3">
      <Text size="small" className="text-ui-fg-subtle">
        ¿Necesitas crear un pedido manualmente? Usa un borrador.
      </Text>
      <Button size="small" variant="secondary" asChild>
        <Link to="/borradores?crear=1">Crear pedido</Link>
      </Button>
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "order.list.before",
})

export default OrderCreateDraftCta
