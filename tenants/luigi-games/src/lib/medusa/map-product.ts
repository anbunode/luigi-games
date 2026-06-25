import type { HttpTypes } from "@medusajs/types"
import type { Product, ProductType } from "@/lib/mock-data"

function minorToMajor(amount: number | undefined | null): number | undefined {
  if (amount === undefined || amount === null) return undefined
  return amount / 100
}

function parseProductType(value: unknown): ProductType {
  const allowed: ProductType[] = [
    "account",
    "giftcard",
    "key",
    "subscription",
  ]
  if (typeof value === "string" && allowed.includes(value as ProductType)) {
    return value as ProductType
  }
  return "key"
}

export function mapMedusaProduct(product: HttpTypes.StoreProduct): Product {
  const variant = product.variants?.[0]
  const calculated = variant?.calculated_price
  const price = minorToMajor(calculated?.calculated_amount) ?? 0
  const originalPrice = minorToMajor(calculated?.original_amount)
  const meta = (product.metadata || {}) as Record<string, string>

  let discount: number | undefined
  if (originalPrice && price && originalPrice > price) {
    discount = Math.round((1 - price / originalPrice) * 100)
  } else if (meta.discount_percent) {
    discount = Number.parseInt(meta.discount_percent, 10)
  }

  const genres =
    meta.genres?.split(",").map((g) => g.trim()).filter(Boolean) ||
    product.tags?.map((t) => t.value).filter(Boolean)

  return {
    id: product.id,
    handle: product.handle || product.id,
    title: product.title || "Untitled",
    type: parseProductType(meta.product_type),
    platform: meta.platform || "Demo",
    region: meta.region || "Global",
    imageUrl:
      product.thumbnail ||
      product.images?.[0]?.url ||
      "/placeholder-product.svg",
    genres,
    price,
    originalPrice,
    discount,
    promoLabel: meta.promo_label || undefined,
    releaseDate: meta.release_date || undefined,
    rating: meta.rating ? Number.parseFloat(meta.rating) : undefined,
    reviewCount: meta.review_count
      ? Number.parseInt(meta.review_count, 10)
      : undefined,
  }
}
