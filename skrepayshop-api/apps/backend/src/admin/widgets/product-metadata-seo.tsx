import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type {
  AdminProduct,
  DetailWidgetProps,
} from "@medusajs/framework/types"
import { ProductMetadataSeoPanel } from "../components/product/ProductMetadataSeoPanel"

const ProductMetadataSeoWidget = ({
  data,
}: DetailWidgetProps<AdminProduct>) => {
  return <ProductMetadataSeoPanel product={data} />
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductMetadataSeoWidget
