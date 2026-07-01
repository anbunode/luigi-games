import { adminFetch } from "./admin-api"

export type OrderAddress = {
  first_name?: string | null
  last_name?: string | null
  company?: string | null
  address_1?: string | null
  address_2?: string | null
  city?: string | null
  postal_code?: string | null
  province?: string | null
  country_code?: string | null
  phone?: string | null
}

export type OrderLineItem = {
  id: string
  title: string
  subtitle?: string | null
  thumbnail?: string | null
  quantity: number
  unit_price: number
  total?: number
  subtotal?: number
  variant_id?: string | null
  product_id?: string | null
  detail?: {
    fulfilled_quantity?: number
    shipped_quantity?: number
    quantity?: number
  } | null
}

export type OrderPayment = {
  id: string
  amount?: number
  currency_code?: string
  captured_at?: string | null
  canceled_at?: string | null
}

export type OrderPaymentCollection = {
  id: string
  status?: string
  amount?: number
  currency_code?: string
  captured_amount?: number | null
  payments?: OrderPayment[]
}

export type OrderFulfillmentItem = {
  id: string
  title?: string
  quantity?: number
  line_item_id?: string
}

export type OrderFulfillment = {
  id: string
  created_at?: string
  packed_at?: string | null
  shipped_at?: string | null
  delivered_at?: string | null
  canceled_at?: string | null
  items?: OrderFulfillmentItem[]
  labels?: Array<{ tracking_number?: string; tracking_url?: string }>
}

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
  region?: { id?: string; name?: string | null } | null
  items?: OrderLineItem[]
}

export type OrderDetail = OrderSummary & {
  subtotal?: number
  shipping_total?: number
  tax_total?: number
  discount_total?: number
  shipping_address?: OrderAddress | null
  billing_address?: OrderAddress | null
  fulfillments?: OrderFulfillment[]
  payment_collections?: OrderPaymentCollection[]
}

export type OrderChange = {
  id: string
  action?: string
  created_at?: string
  description?: string | null
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
  "*region",
  "*items",
].join(",")

export const DETAIL_FIELDS = [
  "id",
  "display_id",
  "status",
  "created_at",
  "email",
  "currency_code",
  "payment_status",
  "fulfillment_status",
  "total",
  "subtotal",
  "shipping_total",
  "tax_total",
  "discount_total",
  "*items",
  "*items.detail",
  "*shipping_address",
  "*billing_address",
  "*fulfillments",
  "*fulfillments.items",
  "*fulfillments.labels",
  "*payment_collections",
  "*payment_collections.payments",
  "*sales_channel",
  "*region",
  "+customer.id",
  "+customer.email",
  "+customer.first_name",
  "+customer.last_name",
].join(",")

export type OrdersListFilters = {
  q?: string
  payment_status?: string
  fulfillment_status?: string
  status?: string
  limit?: number
  offset?: number
}

export async function fetchOrders(
  filters: OrdersListFilters = {}
): Promise<{ orders: OrderSummary[]; count: number }> {
  const params = new URLSearchParams()
  params.set("fields", LIST_FIELDS)
  params.set("order", "-created_at")
  params.set("limit", String(filters.limit ?? 20))
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
  if (filters.status && filters.status !== "all") {
    params.set("status", filters.status)
  }

  const data = await adminFetch<{ orders: OrderSummary[]; count: number }>(
    `/admin/orders?${params.toString()}`
  )

  return {
    orders: data.orders ?? [],
    count: data.count ?? data.orders?.length ?? 0,
  }
}

export async function fetchOrder(id: string): Promise<OrderDetail> {
  const data = await adminFetch<{ order: OrderDetail }>(
    `/admin/orders/${id}?fields=${encodeURIComponent(DETAIL_FIELDS)}`
  )
  if (!data.order) {
    throw new Error("Pedido no encontrado")
  }
  return data.order
}

export async function fetchOrderChanges(orderId: string): Promise<OrderChange[]> {
  const data = await adminFetch<{ order_changes: OrderChange[] }>(
    `/admin/orders/${orderId}/changes`
  )
  return data.order_changes ?? []
}

export async function fetchStockLocations(): Promise<
  Array<{ id: string; name: string }>
> {
  const data = await adminFetch<{
    stock_locations: Array<{ id: string; name: string }>
  }>("/admin/stock-locations?limit=50&fields=id,name")
  return data.stock_locations ?? []
}

export async function cancelOrder(orderId: string): Promise<void> {
  await adminFetch(`/admin/orders/${orderId}/cancel`, {
    method: "POST",
    body: JSON.stringify({}),
  })
}

export async function markOrderPaymentAsPaid(
  paymentCollectionId: string,
  orderId: string
): Promise<void> {
  await adminFetch(
    `/admin/payment-collections/${paymentCollectionId}/mark-as-paid`,
    {
      method: "POST",
      body: JSON.stringify({ order_id: orderId }),
    }
  )
}

export async function capturePayment(paymentId: string): Promise<void> {
  await adminFetch(`/admin/payments/${paymentId}/capture`, {
    method: "POST",
    body: JSON.stringify({}),
  })
}

export async function refundPayment(
  paymentId: string,
  amount: number
): Promise<void> {
  await adminFetch(`/admin/payments/${paymentId}/refund`, {
    method: "POST",
    body: JSON.stringify({ amount }),
  })
}

export type FulfillmentLineInput = {
  id: string
  quantity: number
}

export async function createOrderFulfillment(
  orderId: string,
  locationId: string,
  items: FulfillmentLineInput[]
): Promise<void> {
  await adminFetch(`/admin/orders/${orderId}/fulfillments`, {
    method: "POST",
    body: JSON.stringify({
      location_id: locationId,
      items,
    }),
  })
}

export async function createFulfillmentShipment(
  orderId: string,
  fulfillmentId: string,
  labels: Array<{ tracking_number: string; tracking_url?: string }>
): Promise<void> {
  await adminFetch(
    `/admin/orders/${orderId}/fulfillments/${fulfillmentId}/shipments`,
    {
      method: "POST",
      body: JSON.stringify({ labels }),
    }
  )
}

export async function markFulfillmentDelivered(
  orderId: string,
  fulfillmentId: string
): Promise<void> {
  await adminFetch(
    `/admin/orders/${orderId}/fulfillments/${fulfillmentId}/mark-as-delivered`,
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  )
}

export async function cancelFulfillment(
  orderId: string,
  fulfillmentId: string
): Promise<void> {
  await adminFetch(
    `/admin/orders/${orderId}/fulfillments/${fulfillmentId}/cancel`,
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  )
}

export async function exportOrders(body: Record<string, unknown> = {}): Promise<{
  transaction_id: string
}> {
  return adminFetch<{ transaction_id: string }>("/admin/orders/export", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export function getPrimaryPaymentCollection(
  order: OrderDetail
): OrderPaymentCollection | null {
  return order.payment_collections?.[0] ?? null
}

export function getCapturedPayment(order: OrderDetail): OrderPayment | null {
  for (const collection of order.payment_collections ?? []) {
    const payment = collection.payments?.find((entry) => entry.captured_at)
    if (payment) {
      return payment
    }
  }
  return null
}

export function getCapturablePayment(
  order: OrderDetail
): OrderPayment | null {
  const collection = getPrimaryPaymentCollection(order)
  const payment = collection?.payments?.find((p) => !p.captured_at && !p.canceled_at)
  return payment ?? null
}

export function getUnfulfilledLineItems(order: OrderDetail): Array<{
  item: OrderLineItem
  remaining: number
}> {
  const result: Array<{ item: OrderLineItem; remaining: number }> = []

  for (const item of order.items ?? []) {
    const fulfilled = item.detail?.fulfilled_quantity ?? 0
    const qty = item.quantity ?? 0
    const remaining = Math.max(0, qty - fulfilled)
    if (remaining > 0) {
      result.push({ item, remaining })
    }
  }

  return result
}

export function canCancelOrder(order: OrderDetail): boolean {
  return order.status !== "canceled" && order.status !== "archived"
}

export function canMarkAsPaid(order: OrderDetail): boolean {
  if (order.payment_status === "captured") return false
  const collection = getPrimaryPaymentCollection(order)
  return Boolean(collection?.id)
}

export function canFulfillOrder(order: OrderDetail): boolean {
  if (order.status === "canceled") return false
  return getUnfulfilledLineItems(order).length > 0
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

export function formatOrderDate(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
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

export function formatAddress(address?: OrderAddress | null): string {
  if (!address) return "—"
  const lines = [
    [address.first_name, address.last_name].filter(Boolean).join(" "),
    address.company,
    address.address_1,
    address.address_2,
    [address.postal_code, address.city].filter(Boolean).join(" "),
    address.province,
    address.country_code?.toUpperCase(),
    address.phone,
  ].filter(Boolean)
  return lines.join("\n") || "—"
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

export function computeOrderKpis(
  orders: OrderSummary[],
  totalCount?: number
): OrdersKpiStats {
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
    totalOrders: totalCount ?? orders.length,
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

export function orderStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "Pendiente",
    completed: "Completado",
    archived: "Archivado",
    canceled: "Cancelado",
    requires_action: "Requiere acción",
  }
  return map[status] ?? status.replace(/_/g, " ")
}
