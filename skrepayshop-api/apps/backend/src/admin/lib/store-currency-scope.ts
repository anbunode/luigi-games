export type StoreCurrencyScope = "catalog" | "pricing" | "regions"

export const STORE_CURRENCY_SCOPE_HEADER = "x-skrepay-currency-scope"

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

export const SKREPAY_ROUTE_CHANGE_EVENT = "skrepay:route-change"

export function notifyRouteChange() {
  window.dispatchEvent(new Event(SKREPAY_ROUTE_CHANGE_EVENT))
}

export function withStoreCurrencyScopeHeader(
  init: RequestInit | undefined,
  scope: StoreCurrencyScope
): RequestInit {
  const headers = new Headers(init?.headers ?? undefined)
  headers.set(STORE_CURRENCY_SCOPE_HEADER, scope)
  return { ...init, headers }
}
