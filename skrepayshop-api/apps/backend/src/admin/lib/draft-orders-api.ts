export type AdminRegion = {
  id: string
  name: string
  currency_code: string
  tax_rate: number
  tax_code: string
}

export type AdminCustomer = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
}

export type AdminProduct = {
  id: string
  title: string
  thumbnail: string | null
  variants: AdminProductVariant[]
}

export type AdminProductVariant = {
  id: string
  title: string
  sku: string | null
  prices: {
    id: string
    currency_code: string
    amount: number
  }[]
}

export async function fetchRegions(): Promise<AdminRegion[]> {
  const search = new URLSearchParams()
  search.set("limit", "100")
  
  const response = await fetch(`/admin/regions?${search.toString()}`, {
    credentials: "include",
  })
  
  if (!response.ok) {
    throw new Error("No se pudieron cargar los mercados")
  }
  
  const data = await response.json()
  return data.regions ?? []
}

export async function fetchCustomers(q?: string): Promise<AdminCustomer[]> {
  const search = new URLSearchParams()
  search.set("limit", "50")
  if (q) {
    search.set("q", q)
  }
  
  const response = await fetch(`/admin/customers?${search.toString()}`, {
    credentials: "include",
  })
  
  if (!response.ok) {
    throw new Error("No se pudieron cargar los clientes")
  }
  
  const data = await response.json()
  return data.customers ?? []
}

export async function fetchProducts(q?: string): Promise<AdminProduct[]> {
  const search = new URLSearchParams()
  search.set("limit", "50")
  if (q) {
    search.set("q", q)
  }
  // Fetch specific fields in Medusa v2
  search.set("fields", "id,title,thumbnail,*variants,*variants.prices")
  
  const response = await fetch(`/admin/products?${search.toString()}`, {
    credentials: "include",
  })
  
  if (!response.ok) {
    throw new Error("No se pudieron cargar los productos")
  }
  
  const data = await response.json()
  return data.products ?? []
}
