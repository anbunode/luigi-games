import type { ComponentType, SVGAttributes } from "react"
import {
  ArrowPath,
  BuildingStorefront,
  Buildings,
  Channels,
  CurrencyDollar,
  GlobeEurope,
  Hashtag,
  Key,
  Language,
  LockClosedSolid,
  MapPin,
  ReceiptPercent,
  ShieldCheck,
  Tag,
  Users,
} from "@medusajs/icons"
import type { TFunction } from "i18next"

export type SettingsNavItem = {
  to: string
  label: string
}

type IconComponent = ComponentType<SVGAttributes<SVGSVGElement>>

const SETTINGS_NAV_ICONS: Record<string, IconComponent> = {
  "/settings/store": BuildingStorefront,
  "/settings/users": Users,
  "/settings/roles": ShieldCheck,
  "/settings/policies": ShieldCheck,
  "/settings/regions": GlobeEurope,
  "/settings/tax-regions": ReceiptPercent,
  "/settings/return-reasons": ArrowPath,
  "/settings/refund-reasons": CurrencyDollar,
  "/settings/sales-channels": Channels,
  "/settings/product-types": Tag,
  "/settings/product-tags": Hashtag,
  "/settings/locations": MapPin,
  "/settings/translations": Language,
  "/settings/publishable-api-keys": Key,
  "/settings/secret-api-keys": LockClosedSolid,
  "/settings/workflows": Buildings,
}

export function getSettingsNavIcon(to: string): IconComponent {
  const normalized = to.replace(/^\/app/, "").split("?")[0] ?? to

  return SETTINGS_NAV_ICONS[normalized] ?? Buildings
}

export function getFallbackSettingsNavItems(t: TFunction): SettingsNavItem[] {
  return [
    { to: "/settings/store", label: t("store.domain") },
    { to: "/settings/users", label: t("users.domain") },
    { to: "/settings/regions", label: t("regions.domain") },
    { to: "/settings/tax-regions", label: t("taxRegions.domain") },
    { to: "/settings/return-reasons", label: t("returnReasons.domain") },
    { to: "/settings/refund-reasons", label: t("refundReasons.domain") },
    { to: "/settings/sales-channels", label: t("salesChannels.domain") },
    { to: "/settings/product-types", label: t("productTypes.domain") },
    { to: "/settings/product-tags", label: t("productTags.domain") },
    { to: "/settings/locations", label: t("stockLocations.domain") },
    { to: "/settings/publishable-api-keys", label: t("apiKeyManagement.domain.publishable") },
    { to: "/settings/secret-api-keys", label: t("apiKeyManagement.domain.secret") },
    { to: "/settings/workflows", label: t("workflowExecutions.domain") },
  ]
}

export function scrapeSettingsNavItems(): SettingsNavItem[] {
  const items: SettingsNavItem[] = []
  const seen = new Set<string>()

  document.querySelectorAll("aside nav a").forEach((anchor) => {
    if (!(anchor instanceof HTMLAnchorElement)) {
      return
    }

    const href = anchor.getAttribute("href") ?? ""

    if (!href.includes("/settings/") || href.includes("/settings/profile")) {
      return
    }

    let to = href

    if (to.startsWith("/app")) {
      to = to.slice(4) || "/"
    }

    const label = anchor.textContent?.trim().replace(/\s+/g, " ")

    if (!label || seen.has(to)) {
      return
    }

    seen.add(to)
    items.push({ to, label })
  })

  return items
}
