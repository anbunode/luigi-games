import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { ProductMetadataSeoPanel } from "../components/product/ProductMetadataSeoPanel"

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

  return <ProductMetadataSeoPanel product={data} />
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductMetadataSeoWidget
