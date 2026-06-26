export type RemoteStoreConfig = {
  primary_url?: string | null
  storefront_preview_url?: string | null
}

export type StoreConfig = {
  adminHostname: string
  domainType: "provisional" | "custom"
  storefrontPreviewUrl: string | null
  resolvedStorefrontBaseUrl: string
}

export function getAdminHostname(): string {
  if (typeof window === "undefined") {
    return ""
  }

  return window.location.hostname
}

export function isProvisionalSkrepayShopDomain(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase()

  return (
    normalized.endsWith(".skrepay.shop") &&
    normalized !== "skrepay.shop"
  )
}

export function normalizeStorefrontBaseUrl(value: string): string {
  const trimmed = value.trim()

  if (!trimmed) {
    return ""
  }

  const withProtocol = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`

  try {
    const url = new URL(withProtocol)
    return `${url.protocol}//${url.host}`
  } catch {
    return ""
  }
}

export function classifyStoreDomain(hostname: string): "provisional" | "custom" {
  return isProvisionalSkrepayShopDomain(hostname) ? "provisional" : "custom"
}

export function resolveStorefrontBaseUrl(
  adminHostname: string,
  remote?: RemoteStoreConfig | null
): string {
  const configuredUrl = remote?.primary_url
    ? normalizeStorefrontBaseUrl(remote.primary_url)
    : remote?.storefront_preview_url
      ? normalizeStorefrontBaseUrl(remote.storefront_preview_url)
      : ""

  if (configuredUrl) {
    return configuredUrl
  }

  if (adminHostname) {
    return `https://${adminHostname}`
  }

  return ""
}

export function buildStoreConfig(
  adminHostname: string,
  remote?: RemoteStoreConfig | null
): StoreConfig {
  const resolvedStorefrontBaseUrl = resolveStorefrontBaseUrl(
    adminHostname,
    remote
  )

  let resolvedHost = adminHostname
  try {
    resolvedHost = new URL(resolvedStorefrontBaseUrl).hostname
  } catch {
    // keep admin hostname
  }

  return {
    adminHostname,
    domainType: classifyStoreDomain(resolvedHost),
    storefrontPreviewUrl:
      remote?.primary_url?.trim() ||
      remote?.storefront_preview_url?.trim() ||
      null,
    resolvedStorefrontBaseUrl,
  }
}

export async function loadStoreConfig(): Promise<StoreConfig> {
  const adminHostname = getAdminHostname()
  let remote: RemoteStoreConfig | null = null

  try {
    const domainsResponse = await fetch("/admin/store-domains", {
      credentials: "include",
    })

    if (domainsResponse.ok) {
      const domainsData = await domainsResponse.json()
      remote = {
        primary_url: domainsData?.primary_url ?? null,
      }
    }
  } catch {
    // fallback below
  }

  if (!remote?.primary_url) {
    try {
      const themeResponse = await fetch("/admin/storefront-theme", {
        credentials: "include",
      })

      if (themeResponse.ok) {
        const themeData = await themeResponse.json()
        remote = {
          ...remote,
          primary_url: themeData?.primary_url ?? null,
          storefront_preview_url: themeData?.theme?.storefront_preview_url ?? null,
        }
      }
    } catch {
      // hostname fallback below
    }
  }

  return buildStoreConfig(adminHostname, remote)
}
