import type { TFunction } from "i18next"

export type SettingsNavItem = {
  to: string
  label: string
}

const DEFAULT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" fill="currentColor"><path d="M7.5.5a7 7 0 1 0 0 14 7 7 0 0 0 0-14"/></svg>`

const SETTINGS_NAV_ICON_SVGS: Record<string, string> = {
  "/settings/store": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" fill="currentColor"><path d="M6.5 1A1.5 1.5 0 0 0 5 2.5V3H1.5A1.5 1.5 0 0 0 0 4.5v8A1.5 1.5 0 0 0 1.5 14h12a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 13.5 3H10v-.5A1.5 1.5 0 0 0 8.5 1zM6 2.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5V3H6z"/></svg>`,
  "/settings/users": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" fill="currentColor"><path d="M7.5 1a3 3 0 1 0 0 6 3 3 0 0 0 0-6M2 13.5c0-2.5 2.5-3.5 5.5-3.5s5.5 1 5.5 3.5V14H2z"/></svg>`,
  "/settings/roles": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" fill="currentColor"><path d="M7.3 1.1 6 2.4 4.7 1.1a.6.6 0 0 0-.85.85L5.15 3.5 3.85 4.8a.6.6 0 1 0 .85.85L6 4.35 7.3 5.65a.6.6 0 0 0 .85-.85L6.85 3.5 8.15 1.95a.6.6 0 0 0-.85-.85M3 7.5a4.5 4.5 0 1 0 9 0 4.5 4.5 0 0 0-9 0"/></svg>`,
  "/settings/policies": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" fill="currentColor"><path d="M4 1.5A1.5 1.5 0 0 0 2.5 3v9A1.5 1.5 0 0 0 4 13.5h7A1.5 1.5 0 0 0 12.5 12V5.6L9.4 2.5H4z"/></svg>`,
  "/settings/regions": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" fill="currentColor"><path d="M7.5 1a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13m0 1.5a5 5 0 1 1 0 10 5 5 0 0 1 0-10"/></svg>`,
  "/settings/tax-regions": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" fill="currentColor"><path d="M3 2h9v2H3zm0 4h9v2H3zm0 4h6v2H3z"/></svg>`,
  "/settings/return-reasons": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" fill="currentColor"><path d="M3.5 2.5a5 5 0 0 1 7.8 4.1H13l-2.5 2.5L8 6.6h1.7A3.5 3.5 0 1 0 7.5 11H6v1.5h1.5a5 5 0 0 0 0-10z"/></svg>`,
  "/settings/refund-reasons": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" fill="currentColor"><path d="M7.5 1.5A5.5 5.5 0 1 0 13 7H11.4A4 4 0 1 1 7.5 3.5c1 0 1.9.4 2.6 1H7V6h5.5V1.5z"/></svg>`,
  "/settings/sales-channels": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" fill="currentColor"><path d="M2 4.5h11v6H2zm1.5 1.5v3h8V6z"/></svg>`,
  "/settings/product-types": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" fill="currentColor"><path d="M3 3h4v4H3zm5 0h4v4H8zM3 8h4v4H3zm5 0h4v4H8z"/></svg>`,
  "/settings/product-tags": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" fill="currentColor"><path d="M4 2h4.6L13 6.4V11H4z"/></svg>`,
  "/settings/locations": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" fill="currentColor"><path d="M7.5 1.5a3.5 3.5 0 0 0-3.5 5.2L7.5 13l3.5-6.3A3.5 3.5 0 1 0 7.5 1.5"/></svg>`,
  "/settings/translations": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" fill="currentColor"><path d="M2 3h11v1.5H8.7L11 11H9.5L8.8 8.5H5.2L4.5 11H3L5.3 4.5H2zm4.2 3.5 1.3 3.5 1.3-3.5z"/></svg>`,
  "/settings/publishable-api-keys": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" fill="currentColor"><path d="M5 2.5A2.5 2.5 0 0 0 2.5 5v5A2.5 2.5 0 0 0 5 12.5h5A2.5 2.5 0 0 0 12.5 10V5A2.5 2.5 0 0 0 10 2.5z"/></svg>`,
  "/settings/secret-api-keys": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" fill="currentColor"><path d="M5.5 6.5V5a2 2 0 1 1 4 0v1.5H11v6H4v-6zm2-1.5a.5.5 0 0 0-1 0v1.5h1z"/></svg>`,
  "/settings/workflows": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" fill="currentColor"><path d="M3 3h3v3H3zm6 0h3v3H9zM6 9h3v3H6z"/></svg>`,
}

export function getSettingsNavIconPath(to: string): string {
  const normalized = to.replace(/^\/app/, "").split("?")[0] ?? to

  return SETTINGS_NAV_ICON_SVGS[normalized] ?? DEFAULT_ICON
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
