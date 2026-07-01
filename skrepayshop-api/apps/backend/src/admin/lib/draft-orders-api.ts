import { adminFetch } from "./admin-api"

export type DraftAddress = {
  first_name: string
  last_name: string
  company?: string
  address_1: string
  address_2?: string
  city: string
  province?: string
  postal_code: string
  country_code: string
  phone?: string
}

export const EMPTY_DRAFT_ADDRESS: DraftAddress = {
  first_name: "",
  last_name: "",
  company: "",
  address_1: "",
  address_2: "",
  city: "",
  province: "",
  postal_code: "",
  country_code: "",
  phone: "",
}

export type DraftOrderSummary = {
  id: string
  display_id: number
  email: string | null
  created_at: string
  subtotal?: number
  shipping_total?: number
  tax_total?: number
  discount_total?: number
  total: number
  currency_code: string
  status: string
  customer?: {
    id?: string
    email?: string | null
    first_name?: string | null
    last_name?: string | null
  } | null
  region?: { id?: string; name?: string | null } | null
  sales_channel?: { id?: string; name?: string | null } | null
  shipping_address?: DraftAddress | null
  billing_address?: DraftAddress | null
  metadata?: Record<string, unknown> | null
  items?: Array<{
    id: string
    title: string
    quantity: number
    unit_price: number
    variant_id?: string | null
    sku?: string | null
  }>
}

export type DraftCustomer = {
  id: string
  email: string
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
}

export type DraftProductVariant = {
  id: string
  title?: string
  sku?: string | null
  prices?: Array<{ amount?: number; currency_code?: string }>
}

export type DraftProduct = {
  id: string
  title: string
  thumbnail?: string | null
  variants?: DraftProductVariant[]
}

const LIST_FIELDS =
  "id,display_id,created_at,email,status,currency_code,total,+customer.email,+sales_channel.name,+region.name"

const DETAIL_FIELDS =
  "id,display_id,created_at,email,status,currency_code,subtotal,shipping_total,tax_total,discount_total,total,metadata,+customer.id,+customer.email,+customer.first_name,+customer.last_name,+sales_channel.name,+region.name,*items,*shipping_address,*billing_address"

export const SKREPAY_INVOICE_DUE_ENABLED = "skrepay_invoice_due_enabled"
export const SKREPAY_PAYMENT_DUE_AT = "skrepay_payment_due_at"

export type DraftPaymentTerms = {
  enabled: boolean
  dueAt: string | null
}

export function readDraftPaymentTerms(
  metadata?: Record<string, unknown> | null
): DraftPaymentTerms {
  return {
    enabled: metadata?.[SKREPAY_INVOICE_DUE_ENABLED] === true,
    dueAt:
      typeof metadata?.[SKREPAY_PAYMENT_DUE_AT] === "string"
        ? metadata[SKREPAY_PAYMENT_DUE_AT]
        : null,
  }
}

export function defaultPaymentDueDateInput() {
  const date = new Date()
  date.setDate(date.getDate() + 14)
  return date.toISOString().slice(0, 10)
}

export function paymentDueInputToIso(dateInput: string) {
  return new Date(`${dateInput}T23:59:59`).toISOString()
}

export function paymentDueIsoToInput(iso: string | null) {
  if (!iso) return defaultPaymentDueDateInput()
  try {
    return new Date(iso).toISOString().slice(0, 10)
  } catch {
    return defaultPaymentDueDateInput()
  }
}

export function formatPaymentDueDate(iso: string | null) {
  if (!iso) return "—"
  try {
    return new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(
      new Date(iso)
    )
  } catch {
    return iso
  }
}

async function withDraftEdit(draftId: string, action: () => Promise<void>) {
  await adminFetch(`/admin/draft-orders/${draftId}/edit`, {
    method: "POST",
    body: JSON.stringify({}),
  })
  await action()
  await adminFetch(`/admin/draft-orders/${draftId}/edit/confirm`, {
    method: "POST",
    body: JSON.stringify({}),
  })
}

function cleanAddress(address: DraftAddress): DraftAddress {
  const cleaned: DraftAddress = {
    first_name: address.first_name.trim(),
    last_name: address.last_name.trim(),
    address_1: address.address_1.trim(),
    city: address.city.trim(),
    postal_code: address.postal_code.trim(),
    country_code: address.country_code.trim().toLowerCase(),
  }

  const company = address.company?.trim()
  const address2 = address.address_2?.trim()
  const province = address.province?.trim()
  const phone = address.phone?.trim()

  if (company) cleaned.company = company
  if (address2) cleaned.address_2 = address2
  if (province) cleaned.province = province
  if (phone) cleaned.phone = phone

  return cleaned
}

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
    regions: Array<{
      id: string
      name: string
      currency_code: string
      countries?: Array<{ iso_2?: string; display_name?: string }>
    }>
  }>("/admin/regions?limit=50&fields=id,name,currency_code,*countries")

  return data.regions ?? []
}

export async function fetchDraftSalesChannels() {
  const data = await adminFetch<{
    sales_channels: Array<{ id: string; name: string }>
  }>("/admin/sales-channels?limit=50&fields=id,name")

  return data.sales_channels ?? []
}

export async function fetchDraftStoreDefaults() {
  const data = await adminFetch<{
    stores: Array<{
      id: string
      default_sales_channel_id?: string | null
      default_region_id?: string | null
    }>
  }>("/admin/stores?limit=1&fields=id,default_sales_channel_id,default_region_id")

  return data.stores?.[0] ?? null
}

export async function searchDraftCustomers(query: string) {
  const trimmed = query.trim()
  if (trimmed.length < 2) {
    return []
  }

  const params = new URLSearchParams({
    limit: "20",
    fields: "id,email,first_name,last_name,phone",
    q: trimmed,
  })

  const data = await adminFetch<{ customers: DraftCustomer[] }>(
    `/admin/customers?${params.toString()}`
  )

  return data.customers ?? []
}

export async function fetchCustomerAddresses(customerId: string) {
  const data = await adminFetch<{
    addresses: Array<DraftAddress & { id: string }>
  }>(`/admin/customers/${customerId}/addresses?limit=20`)

  return data.addresses ?? []
}

export async function searchDraftProducts(query: string) {
  const params = new URLSearchParams({
    limit: "25",
    fields: "id,title,thumbnail,+variants.id,+variants.title,+variants.sku,+variants.prices.*",
  })

  if (query.trim()) {
    params.set("q", query.trim())
  }

  const data = await adminFetch<{ products: DraftProduct[] }>(
    `/admin/products?${params.toString()}`
  )

  return data.products ?? []
}

export async function fetchDraftProducts() {
  return searchDraftProducts("")
}

export type CreateDraftOrderInput = {
  region_id: string
  sales_channel_id: string
  customer_id?: string
  email?: string
  shipping_address: DraftAddress
  billing_address?: DraftAddress | null
  same_as_shipping?: boolean
}

export async function createDraftOrder(input: CreateDraftOrderInput) {
  const shipping_address = cleanAddress(input.shipping_address)
  const billing_address = input.same_as_shipping
    ? shipping_address
    : input.billing_address
      ? cleanAddress(input.billing_address)
      : null

  const body: Record<string, unknown> = {
    region_id: input.region_id,
    sales_channel_id: input.sales_channel_id,
    shipping_address,
    billing_address,
  }

  if (input.customer_id) {
    body.customer_id = input.customer_id
  } else if (input.email?.trim()) {
    body.email = input.email.trim()
  }

  const data = await adminFetch<{ draft_order: DraftOrderSummary }>(
    "/admin/draft-orders",
    {
      method: "POST",
      body: JSON.stringify(body),
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

export async function updateDraftPaymentTerms(
  draft: DraftOrderSummary,
  terms: DraftPaymentTerms
) {
  const metadata = {
    ...(draft.metadata ?? {}),
    [SKREPAY_INVOICE_DUE_ENABLED]: terms.enabled,
    [SKREPAY_PAYMENT_DUE_AT]:
      terms.enabled && terms.dueAt ? terms.dueAt : null,
  }

  const body: Record<string, unknown> = { metadata }
  if (draft.email) {
    body.email = draft.email
  }

  const data = await adminFetch<{ draft_order: DraftOrderSummary }>(
    `/admin/draft-orders/${draft.id}`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  )

  return data.draft_order
}

export async function addVariantToDraft(
  draftId: string,
  variantId: string,
  quantity = 1
) {
  await withDraftEdit(draftId, async () => {
    await adminFetch(`/admin/draft-orders/${draftId}/edit/items`, {
      method: "POST",
      body: JSON.stringify({ items: [{ variant_id: variantId, quantity }] }),
    })
  })
}

export async function addCustomItemToDraft(
  draftId: string,
  item: { title: string; quantity: number; unit_price: number }
) {
  await withDraftEdit(draftId, async () => {
    await adminFetch(`/admin/draft-orders/${draftId}/edit/items`, {
      method: "POST",
      body: JSON.stringify({ items: [item] }),
    })
  })
}

export async function updateDraftItemQuantity(
  draftId: string,
  itemId: string,
  quantity: number
) {
  await withDraftEdit(draftId, async () => {
    await adminFetch(`/admin/draft-orders/${draftId}/edit/items/item/${itemId}`, {
      method: "POST",
      body: JSON.stringify({ quantity }),
    })
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

export function formatDraftAddress(address?: DraftAddress | null) {
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
  ].filter((line) => line && String(line).trim())

  return lines.join("\n")
}

export function customerDisplayName(customer?: DraftOrderSummary["customer"]) {
  if (!customer) return null
  const name = [customer.first_name, customer.last_name].filter(Boolean).join(" ")
  return name || null
}
