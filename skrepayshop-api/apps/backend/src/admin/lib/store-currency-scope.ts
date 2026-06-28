export type StoreCurrencyScope = "catalog" | "regions"

export const STORE_CURRENCY_SCOPE_HEADER = "x-skrepay-currency-scope"
export const SKREPAY_ROUTE_CHANGE_EVENT = "skrepay:route-change"

export function normalizeAdminPathname(pathname: string): string {
  return pathname.replace(/^\/app(?=\/|$)/, "") || "/"
}

export function resolveStoreCurrencyScope(pathname: string): StoreCurrencyScope {
  const path = normalizeAdminPathname(pathname)

  if (
    /\/settings\/regions(\/create|\/[^/]+)?\/?$/.test(path) ||
    /\/settings\/regions\/?$/.test(path)
  ) {
    return "regions"
  }

  return "catalog"
}

export function notifyRouteChange() {
  window.dispatchEvent(new Event(SKREPAY_ROUTE_CHANGE_EVENT))
}
