import Medusa from "@medusajs/js-sdk"

const backendUrl =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

export const medusaConfigured = Boolean(
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
)

export const sdk = new Medusa({
  baseUrl: backendUrl,
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
})
