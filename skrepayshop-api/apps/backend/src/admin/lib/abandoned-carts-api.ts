export type AbandonedCartRow = {
  id: string
  updated_at: string
  customer_email?: string
  email?: string
  item_count: number
  subtotal: number
  currency_code: string
}

export type AbandonedCartsListResponse = {
  abandoned_carts: AbandonedCartRow[]
  count: number
  offset: number
  limit: number
}

export async function fetchAbandonedCarts(params?: {
  limit?: number
  offset?: number
}): Promise<AbandonedCartsListResponse> {
  const search = new URLSearchParams()
  search.set("limit", String(params?.limit ?? 20))
  search.set("offset", String(params?.offset ?? 0))

  const response = await fetch(`/admin/abandoned-carts?${search.toString()}`, {
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error("No se pudieron cargar los carritos abandonados")
  }

  return response.json()
}

