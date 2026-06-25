import {
  SHELL_PLACEHOLDER_IMAGE,
  SHELL_PRODUCT_COUNT,
} from "@/lib/shell-catalog"

export type ProductType = "account" | "giftcard" | "key" | "subscription"

export interface Product {
  id: string
  handle: string
  title: string
  type: ProductType
  platform: string
  region: string
  imageUrl: string
  genres?: string[]
  price: number
  originalPrice?: number
  discount?: number
  promoLabel?: string
  releaseDate?: string
  rating?: number
  reviewCount?: number
}

export const navLinks = [
  { label: "INICIO", href: "/", external: false },
  { label: "CATÁLOGO", href: "/search", external: false },
  { label: "OFERTAS", href: "/search?sort=deals", external: false },
]

export const categoryPills = [
  "CATEGORÍA 1",
  "CATEGORÍA 2",
  "CATEGORÍA 3",
  "CATEGORÍA 4",
  "CATEGORÍA 5",
  "CATEGORÍA 6",
]

export const genreTiles = [
  { label: "SECCIÓN 1", color: "#475569", icon: "monitor" },
  { label: "SECCIÓN 2", color: "#1D4ED8", icon: "gamepad" },
  { label: "SECCIÓN 3", color: "#78350F", icon: "crosshair" },
  { label: "SECCIÓN 4", color: "#334155", icon: "zap" },
  { label: "SECCIÓN 5", color: "#166534", icon: "compass" },
  { label: "SECCIÓN 6", color: "#1E40AF", icon: "glasses" },
]

export const products: Product[] = Array.from(
  { length: SHELL_PRODUCT_COUNT },
  (_, index) => {
    const number = index + 1

    return {
      id: `shell-${number}`,
      handle: `producto-${number}`,
      title: `Producto ${number}`,
      type: "key",
      platform: "Demo",
      region: "Global",
      imageUrl: SHELL_PLACEHOLDER_IMAGE,
      price: 24.99,
      originalPrice: 29.99,
      discount: 17,
    }
  }
)

export const recommendedProducts = products.slice(0, 4)
export const bestsellerProducts = products
export const preorderProducts = products.slice(0, 3)
export const listProducts = products.slice(0, 6)
