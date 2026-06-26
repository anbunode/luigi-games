import {
  defaultStorefrontTheme,
  type StorefrontTheme,
} from "@/lib/theme-types"
import { siteConfig } from "@/lib/config/site"
import { sdk, medusaConfigured } from "./config"

export async function getStorefrontTheme(): Promise<StorefrontTheme> {
  if (!medusaConfigured) {
    return defaultStorefrontTheme
  }

  try {
    const { theme } = await sdk.client.fetch<{ theme: StorefrontTheme }>(
      "/store/storefront-theme",
      {
        method: "GET",
        cache: "no-store",
        headers: {
          "x-skrepay-tenant": siteConfig.tenantId,
        },
      }
    )

    return { ...defaultStorefrontTheme, ...theme }
  } catch {
    return defaultStorefrontTheme
  }
}
