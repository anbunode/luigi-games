const PROVISIONAL_DOMAIN_SUFFIX = ".skrepay.shop"

export type StoreDomainType = "provisional" | "custom"

export type RemoteStoreConfig = {
  storefront_preview_url?: string | null
}

export type StoreConfig = {
  adminHostname: string
  domainType: StoreDomainType
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
    normalized.endsWith(PROVISIONAL_DOMAIN_SUFFIX) &&
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

export function getHostnameFromUrl(url: string): string | null {
  const normalized = normalizeStorefrontBaseUrl(url)

  if (!normalized) {
    return null
  }

  try {
    return new URL(normalized).hostname
  } catch {
    return null
  }
}

export function classifyStoreDomain(hostname: string): StoreDomainType {
  return isProvisionalSkrepayShopDomain(hostname) ? "provisional" : "custom"
}

export function resolveStorefrontBaseUrl(
  adminHostname: string,
  remote?: RemoteStoreConfig | null
): string {
  const configuredUrl = remote?.storefront_preview_url
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
  const resolvedHost =
    getHostnameFromUrl(resolvedStorefrontBaseUrl) || adminHostname

  return {
    adminHostname,
    domainType: classifyStoreDomain(resolvedHost),
    storefrontPreviewUrl: remote?.storefront_preview_url?.trim() || null,
    resolvedStorefrontBaseUrl,
  }
}

export async function loadStoreConfig(): Promise<StoreConfig> {
  const adminHostname = getAdminHostname()
  let remote: RemoteStoreConfig | null = null

  try {
    const response = await fetch("/admin/storefront-theme", {
      credentials: "include",
    })

    if (response.ok) {
      const data = await response.json()
      remote = {
        storefront_preview_url: data?.theme?.storefront_preview_url ?? null,
      }
    }
  } catch {
    // Hostname-based fallback is applied below.
  }

  return buildStoreConfig(adminHostname, remote)
}
