export type AdminOrderRow = {
  id: string
  display_id?: number
  status?: string
  email?: string
  created_at?: string
  updated_at?: string
  currency_code?: string
  total?: number
  customer?: { email?: string; first_name?: string; last_name?: string } | null
}

export type OrdersListResponse = {
  orders: AdminOrderRow[]
  count: number
  offset: number
  limit: number
}

export type DraftOrderRow = {
  id: string
  display_id?: number
  status?: string
  email?: string
  created_at?: string
  updated_at?: string
  currency_code?: string
  total?: number
}

export type DraftOrdersListResponse = {
  draft_orders: DraftOrderRow[]
  count: number
  offset: number
  limit: number
}

const ORDER_FIELDS =
  "id,display_id,status,email,created_at,updated_at,currency_code,total,*customer"

export async function fetchOrders(params?: {
  limit?: number
  offset?: number
  q?: string
}): Promise<OrdersListResponse> {
  const search = new URLSearchParams()
  search.set("limit", String(params?.limit ?? 20))
  search.set("offset", String(params?.offset ?? 0))
  search.set("fields", ORDER_FIELDS)
  search.set("order", "-created_at")

  if (params?.q?.trim()) {
    search.set("q", params.q.trim())
  }

  const response = await fetch(`/admin/orders?${search.toString()}`, {
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error("No se pudieron cargar los pedidos")
  }

  return response.json()
}

export async function fetchDraftOrders(params?: {
  limit?: number
  offset?: number
  q?: string
}): Promise<DraftOrdersListResponse> {
  const search = new URLSearchParams()
  search.set("limit", String(params?.limit ?? 20))
  search.set("offset", String(params?.offset ?? 0))
  search.set("order", "-created_at")

  if (params?.q?.trim()) {
    search.set("q", params.q.trim())
  }

  const response = await fetch(`/admin/draft-orders?${search.toString()}`, {
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error("No se pudieron cargar los borradores")
  }

  return response.json()
}

export function formatMoney(amount: number | undefined, currency = "EUR") {
  if (amount == null || Number.isNaN(amount)) {
    return "—"
  }

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount)
}

export function formatDate(value?: string) {
  if (!value) {
    return "—"
  }

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export function orderCustomerLabel(order: AdminOrderRow | DraftOrderRow) {
  if (order.email) {
    return order.email
  }

  const customer = "customer" in order ? order.customer : null
  if (customer?.email) {
    return customer.email
  }

  const name = [customer?.first_name, customer?.last_name].filter(Boolean).join(" ")
  return name || "Cliente sin email"
}
