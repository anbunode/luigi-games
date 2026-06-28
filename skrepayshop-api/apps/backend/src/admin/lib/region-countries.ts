import type { CountryInput } from "../lib/regions-api"

export type RegionCountryOption = CountryInput

/** Catálogo ISO para el selector de condiciones (países) */
export const REGION_COUNTRY_OPTIONS: RegionCountryOption[] = [
  { iso_2: "AR", display_name: "Argentina" },
  { iso_2: "AT", display_name: "Austria" },
  { iso_2: "AU", display_name: "Australia" },
  { iso_2: "BE", display_name: "Bélgica" },
  { iso_2: "BO", display_name: "Bolivia" },
  { iso_2: "BR", display_name: "Brasil" },
  { iso_2: "CA", display_name: "Canadá" },
  { iso_2: "CH", display_name: "Suiza" },
  { iso_2: "CL", display_name: "Chile" },
  { iso_2: "CN", display_name: "China" },
  { iso_2: "CO", display_name: "Colombia" },
  { iso_2: "CR", display_name: "Costa Rica" },
  { iso_2: "CZ", display_name: "Rep. Checa" },
  { iso_2: "DE", display_name: "Alemania" },
  { iso_2: "DK", display_name: "Dinamarca" },
  { iso_2: "DO", display_name: "Rep. Dominicana" },
  { iso_2: "EC", display_name: "Ecuador" },
  { iso_2: "ES", display_name: "España" },
  { iso_2: "FI", display_name: "Finlandia" },
  { iso_2: "FR", display_name: "Francia" },
  { iso_2: "GB", display_name: "Reino Unido" },
  { iso_2: "GR", display_name: "Grecia" },
  { iso_2: "GT", display_name: "Guatemala" },
  { iso_2: "HN", display_name: "Honduras" },
  { iso_2: "IE", display_name: "Irlanda" },
  { iso_2: "IT", display_name: "Italia" },
  { iso_2: "JP", display_name: "Japón" },
  { iso_2: "MX", display_name: "México" },
  { iso_2: "NI", display_name: "Nicaragua" },
  { iso_2: "NL", display_name: "Países Bajos" },
  { iso_2: "NO", display_name: "Noruega" },
  { iso_2: "PA", display_name: "Panamá" },
  { iso_2: "PE", display_name: "Perú" },
  { iso_2: "PL", display_name: "Polonia" },
  { iso_2: "PT", display_name: "Portugal" },
  { iso_2: "PY", display_name: "Paraguay" },
  { iso_2: "SE", display_name: "Suecia" },
  { iso_2: "US", display_name: "Estados Unidos" },
  { iso_2: "UY", display_name: "Uruguay" },
  { iso_2: "VE", display_name: "Venezuela" },
]

export type RegionSuggestion = {
  id: string
  label: string
  name: string
  countries: CountryInput[]
  currencies: { currency_code: string; is_default: boolean }[]
  status: "active" | "draft"
}

export const REGION_SUGGESTIONS: RegionSuggestion[] = [
  {
    id: "us-ca",
    label: "Estados Unidos y Canadá",
    name: "Norteamérica",
    countries: [
      { iso_2: "US", display_name: "Estados Unidos" },
      { iso_2: "CA", display_name: "Canadá" },
    ],
    currencies: [{ currency_code: "USD", is_default: true }],
    status: "active",
  },
  {
    id: "eu",
    label: "Unión Europea",
    name: "Unión Europea",
    countries: [
      { iso_2: "DE", display_name: "Alemania" },
      { iso_2: "FR", display_name: "Francia" },
      { iso_2: "ES", display_name: "España" },
      { iso_2: "IT", display_name: "Italia" },
      { iso_2: "NL", display_name: "Países Bajos" },
      { iso_2: "BE", display_name: "Bélgica" },
      { iso_2: "PT", display_name: "Portugal" },
    ],
    currencies: [{ currency_code: "EUR", is_default: true }],
    status: "active",
  },
  {
    id: "latam",
    label: "Latinoamérica",
    name: "Latinoamérica",
    countries: [
      { iso_2: "MX", display_name: "México" },
      { iso_2: "CO", display_name: "Colombia" },
      { iso_2: "AR", display_name: "Argentina" },
      { iso_2: "CL", display_name: "Chile" },
      { iso_2: "PE", display_name: "Perú" },
      { iso_2: "VE", display_name: "Venezuela" },
    ],
    currencies: [{ currency_code: "USD", is_default: true }],
    status: "draft",
  },
]

const DISMISS_KEY = "skrepay-region-suggestions-dismissed"

export function getDismissedSuggestions(): string[] {
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function dismissSuggestion(id: string) {
  const current = getDismissedSuggestions()
  if (!current.includes(id)) {
    localStorage.setItem(DISMISS_KEY, JSON.stringify([...current, id]))
  }
}

export function flagEmoji(iso2: string): string {
  const codePoints = iso2
    .toUpperCase()
    .split("")
    .map((c) => 127397 + c.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

export function suggestionStillRelevant(
  suggestion: RegionSuggestion,
  usedCountryCodes: Set<string>
): boolean {
  const overlap = suggestion.countries.some((c) =>
    usedCountryCodes.has(c.iso_2.toUpperCase())
  )
  return !overlap
}
