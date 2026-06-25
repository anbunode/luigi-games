import { notFound } from "next/navigation"
import { ProductDetailLayout } from "@/components/product-detail/ProductDetail"
import { getProductByHandle } from "@/lib/medusa/products"

interface ProductPageProps {
  params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { handle } = await params
  const { product } = await getProductByHandle(handle)
  return {
    title: product ? `${product.title} — Luigi Games` : "Product — Luigi Games",
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { handle } = await params
  const { product } = await getProductByHandle(handle)

  if (!product) {
    notFound()
  }

  return <ProductDetailLayout product={product} />
}
