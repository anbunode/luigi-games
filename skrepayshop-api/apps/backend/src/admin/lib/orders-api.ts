import { adminFetch } from "./admin-api"

export type OrderSummary = {
  id: string
  display_id: number
  status: string
  created_at: string
  email: string | null
  payment_status: string
  fulfillment_status: string
  total: number
  currency_code: string
  custom_display_id?: string | null
  customer?: {
    id?: string
    email?: string | null
    first_name?: string | null
    last_name?: string | null
  } | null
  sales_channel?: { id?: string; name?: string | null } | null
  items?: Array<{ id: string; quantity?: number }>
}

const LIST_FIELDS = [
  "id",
  "status",
  "created_at",
  "email",
  "display_id",
  "payment_status",
  "fulfillment_status",
  "total",
  "currency_code",
  "*customer",
  "*sales_channel",
  "*items",
].join(",")

export type OrdersListFilters = {
  q?: string
  payment_status?: string
  fulfillment_status?: string
  limit?: number
  offset?: number
}

export async function fetchOrders(
  filters: OrdersListFilters = {}
): Promise<{ orders: OrderSummary[]; count: number }> {
  const params = new URLSearchParams()
  params.set("fields", LIST_FIELDS)
  params.set("order", "-created_at")
  params.set("limit", String(filters.limit ?? 50))
  params.set("offset", String(filters.offset ?? 0))

  if (filters.q?.trim()) {
    params.set("q", filters.q.trim())
  }
  if (filters.payment_status && filters.payment_status !== "all") {
    params.set("payment_status", filters.payment_status)
  }
  if (filters.fulfillment_status && filters.fulfillment_status !== "all") {
    params.set("fulfillment_status", filters.fulfillment_status)
  }

  const data = await adminFetch<{ orders: OrderSummary[]; count: number }>(
    `/admin/orders?${params.toString()}`
  )

  return {
    orders: data.orders ?? [],
    count: data.count ?? data.orders?.length ?? 0,
  }
}

export function formatOrderMoney(amount: number, currencyCode: string): string {
  const code = (currencyCode || "eur").toUpperCase()
  try {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
    }).format(amount / 100)
  } catch {
    return `${(amount / 100).toFixed(2)} ${code}`
  }
}

export function formatRelativeDate(iso: string): string {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const hours = Math.floor(diffMs / 3_600_000)

  if (hours < 1) return "Hace un momento"
  if (hours < 24) return `Hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Hace ${days} d`

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)
}

export function customerLabel(order: OrderSummary): string {
  const first = order.customer?.first_name ?? ""
  const last = order.customer?.last_name ?? ""
  const name = `${first} ${last}`.trim()
  if (name) return name
  return order.customer?.email ?? order.email ?? "Cliente invitado"
}

export function customerEmail(order: OrderSummary): string {
  return order.customer?.email ?? order.email ?? "—"
}

export function customerInitials(order: OrderSummary): string {
  const label = customerLabel(order)
  const parts = label.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
  }
  return (label.slice(0, 2) || "?").toUpperCase()
}

export function itemCount(order: OrderSummary): number {
  return order.items?.reduce((sum, item) => sum + (item.quantity ?? 1), 0) ?? 0
}

export type OrdersKpiStats = {
  totalOrders: number
  totalRevenue: number
  pendingCount: number
  fulfilledCount: number
  primaryCurrency: string
}

export function computeOrderKpis(orders: OrderSummary[]): OrdersKpiStats {
  let totalRevenue = 0
  let pendingCount = 0
  let fulfilledCount = 0
  const currencyCounts = new Map<string, number>()

  for (const order of orders) {
    totalRevenue += order.total ?? 0
    const currency = (order.currency_code || "eur").toLowerCase()
    currencyCounts.set(currency, (currencyCounts.get(currency) ?? 0) + 1)

    if (
      order.payment_status === "not_paid" ||
      order.payment_status === "awaiting" ||
      order.fulfillment_status === "not_fulfilled"
    ) {
      pendingCount++
    }
    if (order.fulfillment_status === "fulfilled") {
      fulfilledCount++
    }
  }

  const primaryCurrency =
    [...currencyCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "eur"

  return {
    totalOrders: orders.length,
    totalRevenue,
    pendingCount,
    fulfilledCount,
    primaryCurrency,
  }
}

export function paymentStatusLabel(status: string): string {
  const map: Record<string, string> = {
    captured: "Capturado",
    not_paid: "No pagado",
    awaiting: "Pendiente",
    refunded: "Reembolsado",
    partially_refunded: "Reemb. parcial",
    canceled: "Cancelado",
    requires_action: "Requiere acción",
  }
  return map[status] ?? status.replace(/_/g, " ")
}

export function fulfillmentStatusLabel(status: string): string {
  const map: Record<string, string> = {
    fulfilled: "Cumplido",
    not_fulfilled: "No cumplido",
    partially_fulfilled: "Parcial",
    shipped: "Enviado",
    partially_shipped: "Envío parcial",
  }
  return map[status] ?? status.replace(/_/g, " ")
}
