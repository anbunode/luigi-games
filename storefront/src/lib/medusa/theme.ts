import {
  defaultStorefrontTheme,
  type StorefrontTheme,
} from "@/lib/theme-types"
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
      }
    )

    return { ...defaultStorefrontTheme, ...theme }
  } catch {
    return defaultStorefrontTheme
  }
}
