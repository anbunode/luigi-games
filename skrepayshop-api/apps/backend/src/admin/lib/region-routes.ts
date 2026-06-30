export const SKREPAY_ROUTE_CHANGE_EVENT = "skrepay:route-change"

export function normalizeAdminPathname(pathname: string): string {
  return pathname.replace(/^\/app(?=\/|$)/, "") || "/"
}

/** Crear o editar región — única pantalla que usa el catálogo completo */
export function isRegionFormPage(pathname: string): boolean {
  const path = normalizeAdminPathname(pathname)

  return (
    /\/settings\/regions\/create\/?$/.test(path) ||
    /\/settings\/regions\/[^/]+\/edit\/?$/.test(path) ||
    /\/settings\/regions\/[^/]+\/?$/.test(path)
  )
}

export function isStoreSettingsPage(pathname: string): boolean {
  return /\/settings\/store\/?$/.test(normalizeAdminPathname(pathname))
}

/** Tienda → monedas (listado y modal agregar) */
export function isStoreCurrencyManagementPage(pathname: string): boolean {
  const path = normalizeAdminPathname(pathname)

  return (
    /\/settings\/store\/?$/.test(path) ||
    /\/settings\/store\/currencies\/?$/.test(path)
  )
}

/** Tienda → editar */
export function isStoreEditPage(pathname: string): boolean {
  return /\/settings\/store\/edit\/?$/.test(normalizeAdminPathname(pathname))
}

/** Crear/editar producto o tabla de precios de variantes */
export function isProductPricingPage(pathname: string): boolean {
  const path = normalizeAdminPathname(pathname)

  return (
    /\/products\/create\b/.test(path) ||
    /\/products\/[^/]+\/prices\b/.test(path) ||
    /\/products\/[^/]+\/variants\/[^/]+\b/.test(path) ||
    (/\/products\/[^/]+$/.test(path) && !/\/products$/.test(path))
  )
}

export function notifyRouteChange() {
  window.dispatchEvent(new Event(SKREPAY_ROUTE_CHANGE_EVENT))
}
