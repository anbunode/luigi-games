import { sdk } from "./config"
import type { HttpTypes } from "@medusajs/types"
import { siteConfig } from "@/lib/config/site"

const storeHeaders = {
  "x-skrepay-tenant": siteConfig.tenantId,
}

let cachedRegionId: string | null = null

export async function getDefaultRegion(): Promise<HttpTypes.StoreRegion | null> {
  const countryCode = process.env.NEXT_PUBLIC_DEFAULT_REGION || "es"

  try {
    const { regions } = await sdk.client.fetch<{
      regions: HttpTypes.StoreRegion[]
    }>("/store/regions", {
      method: "GET",
      headers: storeHeaders,
      cache: "no-store",
    })

    const match = regions?.find((r) =>
      r.countries?.some((c) => c.iso_2 === countryCode)
    )

    const region = match || regions?.[0] || null
    if (region) {
      cachedRegionId = region.id
    }
    return region
  } catch {
    return null
  }
}

export function getCachedRegionId() {
  return cachedRegionId
}
