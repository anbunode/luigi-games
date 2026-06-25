import Medusa from "@medusajs/js-sdk"

const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  "https://luigi-games-api1.onrender.com"

export const medusaConfigured = Boolean(
  MEDUSA_BACKEND_URL && process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
)

export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
})
