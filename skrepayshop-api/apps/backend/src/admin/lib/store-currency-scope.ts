export type StoreCurrencyScope = "catalog" | "pricing" | "regions"

export function resolveStoreCurrencyScope(pathname: string): StoreCurrencyScope {
  if (/\/products(\/create|\/[^/]+\/prices)/.test(pathname)) {
    return "pricing"
  }

  if (/\/settings\/regions\/(create|[^/]+\/edit)/.test(pathname)) {
    return "catalog"
  }

  if (/\/settings\/store\/edit/.test(pathname)) {
    return "catalog"
  }

  return "regions"
}

export function appendStoreCurrencyScope(url: string, scope: StoreCurrencyScope) {
  const parsed = new URL(url, window.location.origin)

  if (!parsed.pathname.includes("/admin/stores")) {
    return url
  }

  parsed.searchParams.set("currency_scope", scope)
  return `${parsed.pathname}${parsed.search}${parsed.hash}`
}

export const SKREPAY_ROUTE_CHANGE_EVENT = "skrepay:route-change"

export function notifyRouteChange() {
  window.dispatchEvent(new Event(SKREPAY_ROUTE_CHANGE_EVENT))
}
