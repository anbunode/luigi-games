export type StoreCurrencyScope = "catalog" | "pricing" | "regions"

export const STORE_CURRENCY_SCOPE_HEADER = "x-skrepay-currency-scope"

/**
 * Cada sección del panel recibe el scope adecuado pero todas leen
 * del mismo catálogo `{tenant}.currency` vía `store_currency`:
 * - catalog: tienda + crear/editar región (todas las monedas)
 * - pricing: productos / precios (solo monedas de regiones)
 * - regions: resto del panel (monedas de regiones activas)
 */
export function resolveStoreCurrencyScope(pathname: string): StoreCurrencyScope {
  if (
    /\/products\/create\b/.test(pathname) ||
    /\/products\/[^/]+\/prices\b/.test(pathname) ||
    (/\/products\/[^/]+$/.test(pathname) && !/\/products$/.test(pathname))
  ) {
    return "pricing"
  }

  if (
    /\/settings\/regions(\/create|\/[^/]+)?\/?$/.test(pathname) ||
    /\/settings\/store(\/edit)?\/?$/.test(pathname) ||
    /\/settings\/tax-regions/.test(pathname)
  ) {
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

export function shouldAttachStoreCurrencyScope(
  method: string,
  url: string
): boolean {
  return (
    (method === "GET" || method === "POST") && url.includes("/admin/stores")
  )
}
