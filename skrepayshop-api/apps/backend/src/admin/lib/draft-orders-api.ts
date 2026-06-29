import { adminFetch } from "./admin-api"

export type DraftOrderItem = {
  id: string
  title?: string
  quantity?: number
  unit_price?: number
  subtotal?: number
  variant_id?: string
  metadata?: Record<string, unknown> | null
  thumbnail?: string | null
}

export type DraftOrderRow = {
  id: string
  display_id?: number
  status?: string
  email?: string
  customer_id?: string
  created_at?: string
  updated_at?: string
  currency_code?: string
  total?: number
  subtotal?: number
  tax_total?: number
  shipping_total?: number
  discount_total?: number
  metadata?: Record<string, unknown> | null
  customer?: {
    id?: string
    email?: string
    first_name?: string
    last_name?: string
  } | null
  region?: { id?: string; name?: string; currency_code?: string } | null
  sales_channel?: { id?: string; name?: string } | null
  items?: DraftOrderItem[]
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

export type CustomerOption = {
  id: string
  email: string
  first_name?: string | null
  last_name?: string | null
}

export type ProductVariantOption = {
  id: string
  title?: string
  sku?: string | null
  prices?: Array<{ amount: number; currency_code: string }>
  product?: { id: string; title?: string; thumbnail?: string | null }
}

export type ProductOption = {
  id: string
  title: string
  thumbnail?: string | null
  variants?: ProductVariantOption[]
}

const LIST_FIELDS =
  "id,display_id,created_at,email,status,currency_code,total,+customer.email,+sales_channel.name,+region.name"

const DETAIL_FIELDS =
  "id,display_id,status,email,customer_id,created_at,updated_at,currency_code,total,subtotal,tax_total,shipping_total,discount_total,metadata,+region.id,+region.name,+region.currency_code,+sales_channel.id,+sales_channel.name,+customer.id,+customer.email,+customer.first_name,+customer.last_name,items.id,items.title,items.quantity,items.unit_price,items.subtotal,items.variant_id,items.metadata,items.thumbnail"

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

export async function fetchCustomersForDraft(search = "") {
  const params = new URLSearchParams({
    limit: "20",
    fields: "id,email,first_name,last_name",
  })

  if (search.trim()) {
    params.set("q", search.trim())
  }

  const data = await adminFetch<{ customers: CustomerOption[]; count: number }>(
    `/admin/customers?${params.toString()}`
  )

  return {
    customers: data.customers ?? [],
    count: data.count ?? data.customers?.length ?? 0,
  }
}

export async function fetchStoreOrderTags() {
  const tags = new Set<string>()

  const productTags = await adminFetch<{
    product_tags?: Array<{ value?: string }>
  }>("/admin/product-tags?limit=100&fields=id,value").catch(() => ({
    product_tags: [],
  }))

  for (const tag of productTags.product_tags ?? []) {
    if (tag.value?.trim()) {
      tags.add(tag.value.trim())
    }
  }

  const [drafts, orders] = await Promise.all([
    adminFetch<DraftOrdersListResponse>(
      `/admin/draft-orders?limit=50&fields=id,metadata`
    ).catch(() => ({ draft_orders: [] })),
    adminFetch<{ orders: Array<{ metadata?: Record<string, unknown> }> }>(
      `/admin/orders?limit=50&fields=id,metadata`
    ).catch(() => ({ orders: [] })),
  ])

  for (const row of [...(drafts.draft_orders ?? []), ...(orders.orders ?? [])]) {
    const raw = row.metadata?.tags
    if (Array.isArray(raw)) {
      for (const tag of raw) {
        if (typeof tag === "string" && tag.trim()) {
          tags.add(tag.trim())
        }
      }
    }
  }

  return Array.from(tags).sort((a, b) => a.localeCompare(b))
}

export async function searchProductsForDraft(query = "") {
  const params = new URLSearchParams({
    limit: "20",
    fields:
      "id,title,thumbnail,*variants.id,*variants.title,*variants.sku,*variants.prices.amount,*variants.prices.currency_code",
  })

  if (query.trim()) {
    params.set("q", query.trim())
  }

  const data = await adminFetch<{ products: ProductOption[] }>(
    `/admin/products?${params.toString()}`
  )

  return data.products ?? []
}

export type CreateDraftOrderInput = {
  region_id: string
  email?: string
  customer_id?: string
  sales_channel_id?: string
  metadata?: Record<string, unknown>
}

export type UpdateDraftOrderInput = {
  email?: string
  customer_id?: string
  region_id?: string
  metadata?: Record<string, unknown>
}

export type DraftLineItemInput = {
  variant_id?: string
  title?: string
  quantity: number
  unit_price?: number
  metadata?: Record<string, unknown>
}

export async function createDraftOrder(input: CreateDraftOrderInput) {
  return adminFetch<DraftOrderDetailResponse>("/admin/draft-orders", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function updateDraftOrder(id: string, input: UpdateDraftOrderInput) {
  return adminFetch<DraftOrderDetailResponse>(`/admin/draft-orders/${id}`, {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function beginDraftOrderEdit(id: string) {
  return adminFetch<{ draft_order_preview: DraftOrderRow }>(
    `/admin/draft-orders/${id}/edit`,
    { method: "POST", body: JSON.stringify({}) }
  )
}

export async function confirmDraftOrderEdit(id: string) {
  return adminFetch<{ draft_order_preview: DraftOrderRow }>(
    `/admin/draft-orders/${id}/edit/confirm`,
    { method: "POST", body: JSON.stringify({}) }
  )
}

export async function addDraftOrderItems(id: string, items: DraftLineItemInput[]) {
  await beginDraftOrderEdit(id)
  const preview = await adminFetch<{ draft_order_preview: DraftOrderRow }>(
    `/admin/draft-orders/${id}/edit/items`,
    {
      method: "POST",
      body: JSON.stringify({ items }),
    }
  )
  await confirmDraftOrderEdit(id)
  return preview
}

export async function updateDraftOrderItem(
  draftId: string,
  itemId: string,
  input: { quantity: number; unit_price?: number }
) {
  await beginDraftOrderEdit(draftId)
  const preview = await adminFetch<{ draft_order_preview: DraftOrderRow }>(
    `/admin/draft-orders/${draftId}/edit/items/item/${itemId}`,
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  )
  await confirmDraftOrderEdit(draftId)
  return preview
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

export function resolveVariantUnitPrice(
  variant: ProductVariantOption,
  currencyCode?: string
) {
  const prices = variant.prices ?? []
  if (prices.length === 0) {
    return undefined
  }

  const code = currencyCode?.toLowerCase()
  const match =
    prices.find((price) => price.currency_code?.toLowerCase() === code) ??
    prices[0]

  return match?.amount
}

export function customerLabel(customer?: CustomerOption | DraftOrderRow["customer"]) {
  if (!customer) {
    return ""
  }

  const name = [customer.first_name, customer.last_name].filter(Boolean).join(" ")
  if (name && customer.email) {
    return `${name} (${customer.email})`
  }

  return customer.email ?? name
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

export function parseMoneyInput(value: string) {
  const normalized = value.replace(",", ".").trim()
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : NaN
}
