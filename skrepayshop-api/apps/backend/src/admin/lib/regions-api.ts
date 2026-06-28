// ─── Types ─────────────────────────────────────────────────────────────────

export type SkrepayRegionCountry = {
  id: string
  iso_2: string
  display_name: string
}

export type SkrepayRegionCurrency = {
  id: string
  currency_code: string
  is_default: boolean
}

export type SkrepayRegion = {
  id: string
  name: string
  status: "active" | "draft"
  countries: SkrepayRegionCountry[]
  currencies: SkrepayRegionCurrency[]
  created_at?: string
  updated_at?: string
}

export type RegionsListResponse = {
  regions: SkrepayRegion[]
}

export type RegionResponse = {
  region: SkrepayRegion
}

// ─── Create/Update Payloads ────────────────────────────────────────────────

export type CountryInput = { iso_2: string; display_name: string }
export type CurrencyInput = { currency_code: string; is_default: boolean }

export type CreateRegionInput = {
  name: string
  status?: "active" | "draft"
  countries?: CountryInput[]
  currencies?: CurrencyInput[]
}

export type UpdateRegionInput = Partial<CreateRegionInput>

// ─── API Calls ─────────────────────────────────────────────────────────────

export async function fetchRegions(): Promise<RegionsListResponse> {
  const res = await fetch("/admin/skrepay-regions", { credentials: "include" })
  if (!res.ok) throw new Error("No se pudieron cargar las regiones")
  return res.json()
}

export async function fetchRegion(id: string): Promise<RegionResponse> {
  const res = await fetch(`/admin/skrepay-regions/${id}`, { credentials: "include" })
  if (!res.ok) throw new Error("Región no encontrada")
  return res.json()
}

export async function createRegion(payload: CreateRegionInput): Promise<RegionResponse> {
  const res = await fetch("/admin/skrepay-regions", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.message || "No se pudo crear la región")
  }
  return res.json()
}

export async function updateRegion(
  id: string,
  payload: UpdateRegionInput
): Promise<RegionResponse> {
  const res = await fetch(`/admin/skrepay-regions/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.message || "No se pudo actualizar la región")
  }
  return res.json()
}

export async function deleteRegion(id: string): Promise<void> {
  const res = await fetch(`/admin/skrepay-regions/${id}`, {
    method: "DELETE",
    credentials: "include",
  })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.message || "No se pudo eliminar la región")
  }
}
