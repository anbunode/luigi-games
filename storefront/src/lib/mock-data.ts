export type ProductType = "account" | "giftcard" | "key" | "subscription"

export interface Product {
  id: string
  handle: string
  title: string
  type: ProductType
  platform: string
  region: string
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
  { label: "NEW & NOTEWORTHY", href: "/search?sort=new", external: true },
  { label: "PREPAIDS", href: "/search?type=prepaid", external: true },
  { label: "IN-GAME ITEMS", href: "/search?type=ingame", external: true },
  { label: "BUNDLE DEALS", href: "/search?type=bundle", external: true },
  { label: "CS2", href: "/search?category=cs2", external: true },
]

export const categoryPills = [
  "NEW ON LUIGI GAMES",
  "PRE-ORDERS",
  "< 20 €",
  "MYSTERY KEYS",
  "DLC",
  "INDIE",
  "VR GAMES",
  "ACTION",
]

export const genreTiles = [
  { label: "SOFTWARE", color: "#475569", icon: "monitor" },
  { label: "PSN CARD", color: "#1D4ED8", icon: "gamepad" },
  { label: "FPS", color: "#78350F", icon: "crosshair" },
  { label: "ACTION GAMES", color: "#334155", icon: "zap" },
  { label: "ADVENTURE", color: "#166534", icon: "compass" },
  { label: "VR GAMES", color: "#1E40AF", icon: "glasses" },
]

const baseProducts: Omit<Product, "id" | "handle">[] = [
  {
    title: "Steam Gift Card $50 Global Activation Code",
    type: "giftcard",
    platform: "Steam",
    region: "Global",
    price: 44.06,
    originalPrice: 45.99,
    discount: 4,
  },
  {
    title: "Spotify Premium 12 Months Subscription Key",
    type: "subscription",
    platform: "Spotify",
    region: "Global",
    price: 69.99,
    originalPrice: 143.88,
    discount: 51,
    promoLabel: "Xbox Deals",
  },
  {
    title: "Windows 11 Pro Retail Key Global",
    type: "key",
    platform: "Microsoft",
    region: "Global",
    price: 3.01,
    originalPrice: 6.15,
    discount: 51,
  },
  {
    title: "Forza Horizon 5 PC Steam Account",
    type: "account",
    platform: "Steam",
    region: "Global",
    price: 30.22,
    originalPrice: 59.99,
    discount: 50,
    genres: ["RACING", "SIMULATION"],
  },
  {
    title: "EA SPORTS FC 26 PC Steam Account",
    type: "account",
    platform: "Steam",
    region: "Global",
    price: 2.01,
    originalPrice: 69.99,
    discount: 97,
    genres: ["SPORT", "SIMULATION"],
    rating: 5.0,
    reviewCount: 7,
  },
  {
    title: "Amazon Prime Video Top-Up",
    type: "subscription",
    platform: "Amazon",
    region: "Global",
    price: 10.28,
    originalPrice: 71.99,
    discount: 53,
  },
  {
    title: "Super Meat Boy 3D Deluxe Edition PC Steam",
    type: "key",
    platform: "Steam",
    region: "Global",
    price: 24.99,
    genres: ["ACTION", "INDIE"],
    releaseDate: "30 MAR",
  },
  {
    title: "Echoes of Aincrad Deluxe Edition PC Steam",
    type: "key",
    platform: "Steam",
    region: "Global",
    price: 39.99,
    genres: ["ACTION", "RPG"],
  },
  {
    title: "Roblox Gift Card $25 Global",
    type: "giftcard",
    platform: "Roblox",
    region: "Global",
    price: 22.5,
    originalPrice: 25.0,
    discount: 10,
  },
  {
    title: "PlayStation Plus 12 Months",
    type: "subscription",
    platform: "PlayStation",
    region: "Global",
    price: 54.99,
    originalPrice: 79.99,
    discount: 31,
  },
  {
    title: "Xbox Game Pass Ultimate 3 Months",
    type: "subscription",
    platform: "Xbox",
    region: "Global",
    price: 29.99,
    originalPrice: 44.99,
    discount: 33,
    promoLabel: "Descuentos",
  },
  {
    title: "Minecraft Java Edition Key",
    type: "key",
    platform: "Minecraft",
    region: "Global",
    price: 18.99,
    originalPrice: 26.95,
    discount: 30,
  },
]

export const products: Product[] = baseProducts.map((p, i) => ({
  ...p,
  id: `prod-${i + 1}`,
  handle: p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
}))

export const recommendedProducts = products.slice(0, 4)
export const bestsellerProducts = [...products, ...products].slice(0, 12)
export const preorderProducts = products.filter((p) => p.releaseDate)
export const listProducts = products.slice(6, 10)
