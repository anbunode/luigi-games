/**
 * Modos de moneda del panel — fuente única de verdad para rutas.
 *
 * - catalog: tienda, regiones, impuestos (catálogo completo, estable)
 * - pricing: productos / precios (solo monedas de regiones activas)
 */
export type StoreCurrencyMode = "catalog" | "pricing"

export const SKREPAY_ROUTE_CHANGE_EVENT = "skrepay:route-change"

export function isPricingContext(pathname: string): boolean {
  return (
    /\/products\/create\b/.test(pathname) ||
    /\/products\/[^/]+\/prices\b/.test(pathname) ||
    (/\/products\/[^/]+$/.test(pathname) && !/\/products$/.test(pathname))
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
