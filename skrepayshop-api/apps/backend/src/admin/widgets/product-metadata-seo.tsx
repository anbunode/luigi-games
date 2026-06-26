import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { lazy, Suspense } from "react"

const ProductMetadataSeoPanel = lazy(async () => {
  const module = await import("../components/product/ProductMetadataSeoPanel")
  return { default: module.ProductMetadataSeoPanel }
})

type ProductWidgetData = {
  id: string
  title: string
  handle?: string | null
  metadata?: Record<string, unknown> | null
}

type ProductMetadataSeoWidgetProps = {
  data?: ProductWidgetData | null
}

const ProductMetadataSeoWidget = ({ data }: ProductMetadataSeoWidgetProps) => {
  if (!data?.id) {
    return null
  }

  return (
    <Suspense fallback={null}>
      <ProductMetadataSeoPanel product={data} />
    </Suspense>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductMetadataSeoWidget
