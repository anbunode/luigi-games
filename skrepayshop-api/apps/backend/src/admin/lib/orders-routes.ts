import { SKREPAY_ROUTE_CHANGE_EVENT } from "./region-routes"

export const ORDERS_LIST_FLAG = "data-skrepay-orders-list"
export const ORDERS_DETAIL_FLAG = "data-skrepay-orders-detail"

export function normalizeAdminPathname(pathname: string): string {
  return pathname.replace(/^\/app(?=\/|$)/, "") || "/"
}

export function isOrdersListPage(pathname: string): boolean {
  const path = normalizeAdminPathname(pathname)
  return path === "/orders" || path === "/orders/"
}

export function isOrderDetailPage(pathname: string): boolean {
  const path = normalizeAdminPathname(pathname)
  return /^\/orders\/[^/]+$/.test(path) && !path.endsWith("/export")
}

export function isOrdersSectionPage(pathname: string): boolean {
  return isOrdersListPage(pathname) || isOrderDetailPage(pathname)
}

export function getOrderIdFromPath(pathname: string): string | null {
  const path = normalizeAdminPathname(pathname)
  const match = path.match(/^\/orders\/([^/]+)$/)
  return match?.[1] ?? null
}

export function notifyRouteChange() {
  window.dispatchEvent(new Event(SKREPAY_ROUTE_CHANGE_EVENT))
}
