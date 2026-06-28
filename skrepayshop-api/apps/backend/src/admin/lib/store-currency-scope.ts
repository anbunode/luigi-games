/**
 * Modos de moneda del panel — fuente única de verdad para rutas.
 *
 * - catalog: tienda (monedas habilitadas en la tienda)
 * - pricing: productos (moneda base + monedas de regiones)
 */
export type StoreCurrencyMode = "catalog" | "pricing"

export const SKREPAY_ROUTE_CHANGE_EVENT = "skrepay:route-change"

export function normalizeAdminPathname(pathname: string): string {
  return pathname.replace(/^\/app(?=\/|$)/, "") || "/"
}

export function isPricingContext(pathname: string): boolean {
  const path = normalizeAdminPathname(pathname)

  return (
    /\/products\/create\b/.test(path) ||
    /\/products\/[^/]+\/prices\b/.test(path) ||
    (/\/products\/[^/]+$/.test(path) && !/\/products$/.test(path))
  )
}

export function isCatalogContext(pathname: string): boolean {
  return !isPricingContext(pathname)
}

export function resolveStoreCurrencyMode(pathname: string): StoreCurrencyMode {
  return isPricingContext(pathname) ? "pricing" : "catalog"
}

export function notifyRouteChange() {
  window.dispatchEvent(new Event(SKREPAY_ROUTE_CHANGE_EVENT))
}

/** @deprecated El API de tienda ya no usa scopes por header; solo pricing vía endpoint dedicado */
export const STORE_CURRENCY_SCOPE_HEADER = "x-skrepay-currency-scope"

export type StoreCurrencyScope = "catalog" | "pricing" | "regions"
