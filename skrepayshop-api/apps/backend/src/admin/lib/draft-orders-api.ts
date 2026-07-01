import { adminFetch } from "./admin-api"

export type DraftOrderSummary = {
  id: string
  display_id: number
  email: string | null
  created_at: string
  total: number
  currency_code: string
  status: string
  customer?: { id?: string; email?: string | null } | null
  region?: { id?: string; name?: string | null } | null
  sales_channel?: { id?: string; name?: string | null } | null
  items?: Array<{
    id: string
    title: string
    quantity: number
    unit_price: number
    variant_id?: string | null
  }>
}

const LIST_FIELDS =
  "id,display_id,created_at,email,status,currency_code,total,+customer.email,+sales_channel.name,+region.name"

const DETAIL_FIELDS =
  "id,display_id,created_at,email,status,currency_code,total,+customer.email,+sales_channel.name,+region.name,*items"

export async function fetchDraftOrders() {
  const data = await adminFetch<{
    draft_orders: DraftOrderSummary[]
    count: number
  }>(
    `/admin/draft-orders?limit=50&order=-created_at&fields=${encodeURIComponent(LIST_FIELDS)}`
  )

  return data.draft_orders ?? []
}

export async function fetchDraftOrder(id: string) {
  const data = await adminFetch<{ draft_order: DraftOrderSummary }>(
    `/admin/draft-orders/${id}?fields=${encodeURIComponent(DETAIL_FIELDS)}`
  )

  return data.draft_order
}

export async function fetchDraftRegions() {
  const data = await adminFetch<{
    regions: Array<{ id: string; name: string; currency_code: string }>
  }>("/admin/regions?limit=50&fields=id,name,currency_code")

  return data.regions ?? []
}

export async function fetchDraftProducts() {
  const data = await adminFetch<{
    products: Array<{
      id: string
      title: string
      variants?: Array<{ id: string; title?: string; sku?: string }>
    }>
  }>("/admin/products?limit=50&fields=id,title,+variants.id,+variants.title,+variants.sku")

  return data.products ?? []
}

export async function createDraftOrder(input: {
  email: string
  region_id: string
}) {
  const data = await adminFetch<{ draft_order: DraftOrderSummary }>(
    "/admin/draft-orders",
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  )

  return data.draft_order
}

export async function convertDraftOrder(id: string) {
  return adminFetch(`/admin/draft-orders/${id}/convert-to-order`, {
    method: "POST",
    body: JSON.stringify({}),
  })
}

export async function deleteDraftOrder(id: string) {
  return adminFetch(`/admin/draft-orders/${id}`, { method: "DELETE" })
}

export async function addVariantToDraft(
  draftId: string,
  variantId: string,
  quantity = 1
) {
  await adminFetch(`/admin/draft-orders/${draftId}/edit`, { method: "POST" })
  await adminFetch(`/admin/draft-orders/${draftId}/edit/items`, {
    method: "POST",
    body: JSON.stringify({ items: [{ variant_id: variantId, quantity }] }),
  })
  await adminFetch(`/admin/draft-orders/${draftId}/edit/confirm`, {
    method: "POST",
    body: JSON.stringify({}),
  })
}

export function formatDraftMoney(amount: number, currencyCode: string) {
  const code = (currencyCode || "eur").toUpperCase()

  try {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: code,
    }).format(amount / 100)
  } catch {
    return `${(amount / 100).toFixed(2)} ${code}`
  }
}

export function formatDraftDate(value: string) {
  try {
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value))
  } catch {
    return value
  }
}
