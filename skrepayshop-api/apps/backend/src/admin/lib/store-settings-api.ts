import { adminFetch } from "./admin-api"

export type StoreSettingsStore = {
  id: string
  name: string
  default_region_id: string | null
  default_sales_channel_id: string | null
  default_location_id: string | null
  supported_currencies?: Array<{
    currency_code: string
    is_default?: boolean
    is_tax_inclusive?: boolean
  }>
  metadata?: Record<string, unknown> | null
}

export type StoreSettingsLocation = {
  id: string
  name: string
  address?: {
    address_1?: string | null
    address_2?: string | null
    city?: string | null
    province?: string | null
    postal_code?: string | null
    country_code?: string | null
  } | null
}

export type StoreSettingsRegion = {
  id: string
  name: string
  countries?: Array<{ iso_2?: string; display_name?: string }>
}

export type StoreSettingsUser = {
  user: {
    email: string
    first_name?: string | null
    last_name?: string | null
    metadata?: Record<string, unknown> | null
  }
}

export type StoreSettingsSnapshot = {
  store: StoreSettingsStore
  userEmail: string | null
  phone: string | null
  location: StoreSettingsLocation | null
  region: StoreSettingsRegion | null
  defaultCurrencyCode: string | null
}

const STORE_EDIT_PATH = "/app/settings/store/edit"
const REGIONS_PATH = "/app/settings/regions"

export { STORE_EDIT_PATH, REGIONS_PATH }

export async function fetchStoreSettingsSnapshot(): Promise<StoreSettingsSnapshot> {
  const storesBody = await adminFetch<{ stores: StoreSettingsStore[] }>(
    "/admin/stores"
  )
  const store = storesBody.stores?.[0]

  if (!store) {
    throw new Error("No store found")
  }

  const defaultCurrencyCode =
    store.supported_currencies?.find((row) => row.is_default)?.currency_code ??
    store.supported_currencies?.[0]?.currency_code ??
    null

  const [userResult, locationResult, regionResult] = await Promise.allSettled([
    adminFetch<StoreSettingsUser>("/admin/users/me"),
    store.default_location_id
      ? adminFetch<{ stock_location: StoreSettingsLocation }>(
          `/admin/stock-locations/${store.default_location_id}?fields=id,name,*address`
        )
      : Promise.resolve(null),
    store.default_region_id
      ? adminFetch<{ region: StoreSettingsRegion }>(
          `/admin/regions/${store.default_region_id}?fields=id,name,*countries`
        )
      : Promise.resolve(null),
  ])

  const user =
    userResult.status === "fulfilled" ? userResult.value.user : null
  const location =
    locationResult.status === "fulfilled" && locationResult.value
      ? locationResult.value.stock_location
      : null
  const region =
    regionResult.status === "fulfilled" && regionResult.value
      ? regionResult.value.region
      : null

  const metadataPhone =
    (store.metadata?.phone as string | undefined) ??
    (user?.metadata?.phone as string | undefined) ??
    null

  return {
    store,
    userEmail: user?.email ?? null,
    phone: metadataPhone,
    location,
    region,
    defaultCurrencyCode,
  }
}

export function countryFlagEmoji(iso2: string | null | undefined): string | null {
  if (!iso2 || iso2.length !== 2) {
    return null
  }

  const code = iso2.toUpperCase()

  return String.fromCodePoint(
    ...[...code].map((char) => 0x1f1e6 + char.charCodeAt(0) - 65)
  )
}

export function formatPostalAddress(
  location: StoreSettingsLocation | null,
  region: StoreSettingsRegion | null
): string | null {
  const address = location?.address
  if (!address) {
    return null
  }

  const parts = [
    address.address_1,
    address.address_2,
    [address.city, address.province].filter(Boolean).join(", "),
    address.postal_code,
    address.country_code?.toUpperCase(),
  ].filter((part) => part && String(part).trim())

  if (parts.length) {
    return parts.join(", ")
  }

  const country = region?.countries?.[0]?.display_name
  return country ?? null
}

export function formatCurrencyLabel(code: string | null | undefined): string {
  if (!code) {
    return "—"
  }

  const upper = code.toUpperCase()

  try {
    const displayName = new Intl.DisplayNames(["es"], { type: "currency" }).of(
      upper
    )
    const parts = new Intl.NumberFormat("es", {
      style: "currency",
      currency: upper,
    }).formatToParts(0)
    const symbol =
      parts.find((part) => part.type === "currency")?.value ?? upper

    if (displayName) {
      return `${displayName} (${upper} ${symbol})`
    }
  } catch {
    // fall through
  }

  return upper
}

export function resolveCountryCode(
  location: StoreSettingsLocation | null,
  region: StoreSettingsRegion | null
): string | null {
  return (
    location?.address?.country_code?.toLowerCase() ??
    region?.countries?.[0]?.iso_2?.toLowerCase() ??
    null
  )
}

export type StoreCurrencyOption = {
  currency_code: string
  is_default?: boolean
  is_tax_inclusive?: boolean
}

export async function updateStoreDefaultCurrency(
  storeId: string,
  currencies: StoreCurrencyOption[],
  newDefaultCode: string
): Promise<StoreSettingsStore> {
  const normalized = newDefaultCode.toLowerCase()

  const taxState = await adminFetch<{
    enabled: boolean
  }>("/admin/skrepay/store-local-currency-tax")

  const supported_currencies = currencies.map((row) => ({
    currency_code: row.currency_code,
    is_default: row.currency_code.toLowerCase() === normalized,
    is_tax_inclusive:
      row.currency_code.toLowerCase() === normalized
        ? taxState.enabled === true
        : false,
  }))

  const body = await adminFetch<{ store: StoreSettingsStore }>(
    `/admin/stores/${storeId}`,
    {
      method: "POST",
      body: JSON.stringify({ supported_currencies }),
    }
  )

  return body.store
}
