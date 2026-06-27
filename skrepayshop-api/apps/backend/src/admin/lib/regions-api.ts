export type AdminRegion = {
  id: string
  name: string
  currency_code: string
  tax_rate: number
  tax_code: string
  countries: {
    iso_2: string
    iso_3: string
    num_code: number
    name: string
    display_name: string
  }[]
  automatic_taxes: boolean
}

export type AdminCurrency = {
  code: string
  symbol: string
  symbol_native: string
  name: string
}

export async function fetchRegions(): Promise<AdminRegion[]> {
  const search = new URLSearchParams()
  search.set("limit", "100")
  search.set("expand", "countries")
  
  const response = await fetch(`/admin/regions?${search.toString()}`, {
    credentials: "include",
  })
  
  if (!response.ok) {
    throw new Error("No se pudieron cargar los mercados")
  }
  
  const data = await response.json()
  return data.regions ?? []
}

export async function fetchRegion(id: string): Promise<AdminRegion> {
  const search = new URLSearchParams()
  search.set("expand", "countries")

  const response = await fetch(`/admin/regions/${id}?${search.toString()}`, {
    credentials: "include",
  })
  
  if (!response.ok) {
    throw new Error("No se pudo cargar el mercado")
  }
  
  const data = await response.json()
  return data.region
}

export async function updateRegion(id: string, payload: any): Promise<AdminRegion> {
  const response = await fetch(`/admin/regions/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || "Error actualizando mercado")
  }

  const data = await response.json()
  return data.region
}

export async function fetchCurrencies(): Promise<AdminCurrency[]> {
  const search = new URLSearchParams()
  search.set("limit", "200")
  
  const response = await fetch(`/admin/currencies?${search.toString()}`, {
    credentials: "include",
  })
  
  if (!response.ok) {
    throw new Error("No se pudieron cargar las monedas")
  }
  
  const data = await response.json()
  return data.currencies ?? []
}
