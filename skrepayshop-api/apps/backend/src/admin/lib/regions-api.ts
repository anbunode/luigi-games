export type RegionCountry = {
  iso_2: string
  display_name: string
}

export type RegionCurrency = {
  currency_code: string
  is_default: boolean
}

export type SkrepayRegion = {
  id: string
  name: string
  status: "active" | "draft"
  countries: RegionCountry[]
  currencies: RegionCurrency[]
  currency_code?: string
  created_at?: string
  updated_at?: string
}

export type CountryInput = RegionCountry
export type CurrencyInput = RegionCurrency

export type CreateRegionInput = {
  name: string
  status?: "active" | "draft"
  countries?: CountryInput[]
  currencies?: CurrencyInput[]
}

export type UpdateRegionInput = Partial<CreateRegionInput>

export async function fetchRegions() {
  const res = await fetch("/admin/regions", { credentials: "include" })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.message || "No se pudieron cargar las regiones")
  }
  return res.json() as Promise<{ regions: SkrepayRegion[] }>
}

export async function fetchRegion(id: string) {
  const res = await fetch(`/admin/regions/${id}`, { credentials: "include" })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.message || "Región no encontrada")
  }
  return res.json() as Promise<{ region: SkrepayRegion }>
}

export async function createRegion(payload: CreateRegionInput) {
  const res = await fetch("/admin/regions", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.message || "No se pudo crear la región")
  }
  return res.json() as Promise<{ region: SkrepayRegion }>
}

export async function updateRegion(id: string, payload: UpdateRegionInput) {
  const res = await fetch(`/admin/regions/${id}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.message || "No se pudo actualizar la región")
  }
  return res.json() as Promise<{ region: SkrepayRegion }>
}

export async function deleteRegion(id: string) {
  const res = await fetch(`/admin/regions/${id}`, {
    method: "DELETE",
    credentials: "include",
  })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.message || "No se pudo eliminar la región")
  }
}

export function formatCurrencyLabel(code: string): string {
  const upper = code.toUpperCase()
  const names: Record<string, string> = {
    USD: "Dólar estadounidense",
    EUR: "Euro",
    GBP: "Libra esterlina",
    MXN: "Peso mexicano",
    BRL: "Real brasileño",
    ARS: "Peso argentino",
    CLP: "Peso chileno",
    COP: "Peso colombiano",
    PEN: "Sol peruano",
    VES: "Bolívar venezolano",
  }
  const name = names[upper]
  return name ? `${name} (${upper} $)` : upper
}

export function regionCustomizationsSummary(region: SkrepayRegion): string {
  const parts: string[] = []
  if (region.currencies?.length) {
    const code = region.currencies.find((c) => c.is_default)?.currency_code
    if (code) parts.push(formatCurrencyLabel(code))
  }
  if (region.countries?.length > 1) {
    parts.push(`${region.countries.length} países`)
  }
  return parts.join(" · ") || "—"
}
