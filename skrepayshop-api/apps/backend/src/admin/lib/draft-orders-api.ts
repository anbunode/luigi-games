import { adminFetch } from "./admin-api"

export type DraftOrderRow = {
  id: string
  display_id?: number
  status?: string
  email?: string
  created_at?: string
  updated_at?: string
  currency_code?: string
  total?: number
  subtotal?: number
  tax_total?: number
  shipping_total?: number
  discount_total?: number
  customer?: { email?: string; first_name?: string; last_name?: string } | null
  region?: { id?: string; name?: string } | null
  sales_channel?: { id?: string; name?: string } | null
  items?: Array<{
    id: string
    title?: string
    quantity?: number
    unit_price?: number
    subtotal?: number
  }>
}

export type DraftOrdersListResponse = {
  draft_orders: DraftOrderRow[]
  count: number
  offset: number
  limit: number
}

export type DraftOrderDetailResponse = {
  draft_order: DraftOrderRow
}

export type RegionOption = {
  id: string
  name: string
  currency_code?: string
}

export type SalesChannelOption = {
  id: string
  name: string
}

const LIST_FIELDS =
  "id,display_id,created_at,email,status,currency_code,total,+customer.email,+sales_channel.name,+region.name"

const DETAIL_FIELDS =
  "id,display_id,status,email,created_at,updated_at,currency_code,total,subtotal,tax_total,shipping_total,discount_total,+region.id,+region.name,+sales_channel.id,+sales_channel.name,+customer.email,items.id,items.title,items.quantity,items.unit_price,items.subtotal"

export async function fetchDraftOrders(limit = 20) {
  return adminFetch<DraftOrdersListResponse>(
    `/admin/draft-orders?limit=${limit}&order=-created_at&fields=${encodeURIComponent(LIST_FIELDS)}`
  )
}

export async function fetchDraftOrder(id: string) {
  return adminFetch<DraftOrderDetailResponse>(
    `/admin/draft-orders/${id}?fields=${encodeURIComponent(DETAIL_FIELDS)}`
  )
}

export async function fetchRegionsForDraft() {
  const data = await adminFetch<{ regions: RegionOption[] }>(
    "/admin/regions?limit=100&fields=id,name,currency_code"
  )
  return data.regions ?? []
}

export async function fetchSalesChannelsForDraft() {
  const data = await adminFetch<{ sales_channels: SalesChannelOption[] }>(
    "/admin/sales-channels?limit=100&fields=id,name"
  )
  return data.sales_channels ?? []
}

export type CreateDraftOrderInput = {
  region_id: string
  email: string
  sales_channel_id?: string
}

export async function createDraftOrder(input: CreateDraftOrderInput) {
  return adminFetch<DraftOrderDetailResponse>("/admin/draft-orders", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function deleteDraftOrder(id: string) {
  return adminFetch<{ id: string; deleted: boolean }>(
    `/admin/draft-orders/${id}`,
    { method: "DELETE" }
  )
}

export async function convertDraftOrderToOrder(id: string) {
  return adminFetch<{ order: { id: string } }>(
    `/admin/draft-orders/${id}/convert-to-order`,
    { method: "POST", body: JSON.stringify({}) }
  )
}

export function formatMoney(amount?: number, currency?: string) {
  if (amount == null || Number.isNaN(amount)) {
    return "—"
  }

  const code = (currency ?? "EUR").toUpperCase()

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
    }).format(amount)
  } catch {
    return `${amount} ${code}`
  }
}

export function formatDraftDate(value?: string) {
  if (!value) {
    return { short: "—", full: "" }
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return { short: "—", full: "" }
  }

  return {
    short: date.toLocaleDateString(),
    full: date.toLocaleString(),
  }
}
