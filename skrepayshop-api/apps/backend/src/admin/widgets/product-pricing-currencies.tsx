import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useQueryClient } from "@tanstack/react-query"
import { useLayoutEffect } from "react"
import { installAuthBridge } from "../lib/auth-bridge"
import { registerProductPricingQueryClient } from "../lib/product-pricing-bridge"

/**
 * Registra el query client para el puente global de precios de producto.
 * La lógica vive en installProductPricingBridge() (auth-bridge).
 */
const ProductPricingCurrencies = () => {
  const queryClient = useQueryClient()

  useLayoutEffect(() => {
    installAuthBridge()
    registerProductPricingQueryClient(queryClient)
  }, [queryClient])

  return null
}

export const config = defineWidgetConfig({
  zone: [
    "product.details.before",
    "product.details.after",
    "product.list.before",
    "product.list.after",
    "order.list.before",
    "customer.list.before",
    "price_list.list.before",
  ],
})

export default ProductPricingCurrencies
