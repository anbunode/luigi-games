import type { HttpTypes } from "@medusajs/types"
import { products as mockProducts, type Product } from "@/lib/mock-data"
import { sdk, medusaConfigured } from "./config"
import { getDefaultRegion } from "./regions"
import { mapMedusaProduct } from "./map-product"
import { siteConfig } from "@/lib/config/site"

const storeHeaders = {
  "x-skrepay-tenant": siteConfig.tenantId,
}

export type ProductSource = "medusa" | "mock"

export interface ProductListResult {
  products: Product[]
  count: number
  source: ProductSource
}

function useMockData(): boolean {
  return (
    process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true" || !medusaConfigured
  )
}

export async function listProducts(options?: {
  limit?: number
  offset?: number
  q?: string
}): Promise<ProductListResult> {
  const limit = options?.limit ?? 12
  const offset = options?.offset ?? 0

  if (useMockData()) {
    const sliced = mockProducts.slice(offset, offset + limit)
    return {
      products: sliced,
      count: mockProducts.length,
      source: "mock",
    }
  }

  try {
    const region = await getDefaultRegion()
    if (!region) {
      throw new Error("No region available")
    }

    const { products, count } = await sdk.client.fetch<{
      products: HttpTypes.StoreProduct[]
      count: number
    }>("/store/products", {
      method: "GET",
      headers: storeHeaders,
      query: {
        limit,
        offset,
        region_id: region.id,
        q: options?.q,
        fields:
          "*variants.calculated_price,+variants.inventory_quantity,*variants.images,+metadata,+tags,+thumbnail",
      },
      cache: "no-store",
    })

    return {
      products: (products || []).map(mapMedusaProduct),
      count: count ?? products?.length ?? 0,
      source: "medusa",
    }
  } catch {
    const sliced = mockProducts.slice(offset, offset + limit)
    return {
      products: sliced,
      count: mockProducts.length,
      source: "mock",
    }
  }
}

export async function getProductByHandle(
  handle: string
): Promise<{ product: Product | null; source: ProductSource }> {
  if (useMockData()) {
    const product = mockProducts.find((p) => p.handle === handle) ?? null
    return { product, source: "mock" }
  }

  try {
    const region = await getDefaultRegion()
    if (!region) {
      throw new Error("No region available")
    }

    const { products } = await sdk.client.fetch<{
      products: HttpTypes.StoreProduct[]
    }>("/store/products", {
      method: "GET",
      headers: storeHeaders,
      query: {
        handle,
        limit: 1,
        region_id: region.id,
        fields:
          "*variants.calculated_price,+variants.inventory_quantity,*variants.images,+metadata,+tags,+thumbnail",
      },
      cache: "no-store",
    })

    const raw = products?.[0]
    if (!raw) {
      const fallback = mockProducts.find((p) => p.handle === handle) ?? null
      return { product: fallback, source: "mock" }
    }

    return { product: mapMedusaProduct(raw), source: "medusa" }
  } catch {
    const product = mockProducts.find((p) => p.handle === handle) ?? null
    return { product, source: "mock" }
  }
}
