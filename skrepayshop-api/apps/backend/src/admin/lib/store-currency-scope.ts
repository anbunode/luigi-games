export const SKREPAY_ROUTE_CHANGE_EVENT = "skrepay:route-change"

export function normalizeAdminPathname(pathname: string): string {
  return pathname.replace(/^\/app(?=\/|$)/, "") || "/"
}

/** Crear o editar región — necesita catálogo completo vía overlay aislado */
export function needsRegionCurrencyOverlay(pathname: string): boolean {
  const path = normalizeAdminPathname(pathname)

  return (
    /\/settings\/regions\/create\/?$/.test(path) ||
    /\/settings\/regions\/[^/]+\/?$/.test(path)
  )
}

export function isStoreSettingsPage(pathname: string): boolean {
  return /\/settings\/store\/?$/.test(normalizeAdminPathname(pathname))
}

export function notifyRouteChange() {
  window.dispatchEvent(new Event(SKREPAY_ROUTE_CHANGE_EVENT))
}
