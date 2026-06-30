import { adminFetch } from "./admin-api"
import { parseInternationalPhone } from "./phone-country-codes"

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
  contactEmail: string | null
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

  const contactEmail =
    (store.metadata?.contact_email as string | undefined) ??
    user?.email ??
    null

  return {
    store,
    userEmail: user?.email ?? null,
    contactEmail,
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

export type UniversalCountryOption = {
  iso_2: string
  display_name: string
}

export async function fetchUniversalCountries(): Promise<UniversalCountryOption[]> {
  const body = await adminFetch<{ countries: UniversalCountryOption[] }>(
    "/admin/skrepay/countries"
  )

  return body.countries ?? []
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

export type StoreContactDetailsInput = {
  name: string
  contact_email: string
  phone: string
}

export async function updateStoreContactDetails(
  storeId: string,
  currentMetadata: Record<string, unknown> | null | undefined,
  input: StoreContactDetailsInput
): Promise<StoreSettingsStore> {
  const parsedPhone = parseInternationalPhone(input.phone, "us")

  const metadata = {
    ...(currentMetadata ?? {}),
    contact_email: input.contact_email.trim(),
    phone_country_code: parsedPhone.countryCode,
    phone: input.phone.trim(),
  }

  const body = await adminFetch<{ store: StoreSettingsStore }>(
    `/admin/stores/${storeId}`,
    {
      method: "POST",
      body: JSON.stringify({
        name: input.name.trim(),
        metadata,
      }),
    }
  )

  return body.store
}

export type StoreAddressInput = {
  companyName: string
  address_1: string
  address_2: string
  city: string
  province: string
  postal_code: string
  country_code: string
}

export type StoreBusinessInfoInput = {
  business_type: string
  business_name: string
  business_alias: string
  business_country_code: string
  phone: string
  address_1: string
  address_2: string
  city: string
  province: string
  postal_code: string
}

export async function updateStoreBusinessInfo(
  storeId: string,
  locationId: string | null,
  currentMetadata: Record<string, unknown> | null | undefined,
  input: StoreBusinessInfoInput
): Promise<void> {
  const parsedPhone = parseInternationalPhone(
    input.phone,
    input.business_country_code
  )

  const metadata = {
    ...(currentMetadata ?? {}),
    business_type: input.business_type,
    business_name: input.business_name.trim(),
    business_alias: input.business_alias.trim(),
    business_country_code: input.business_country_code.toLowerCase(),
    phone_country_code: parsedPhone.countryCode,
    phone: input.phone.trim(),
  }

  await adminFetch<{ store: StoreSettingsStore }>(`/admin/stores/${storeId}`, {
    method: "POST",
    body: JSON.stringify({ metadata }),
  })

  await updateStoreLocationAddress(storeId, locationId, {
    companyName: input.business_name.trim() || input.business_alias.trim() || "Tienda",
    address_1: input.address_1,
    address_2: input.address_2,
    city: input.city,
    province: input.province,
    postal_code: input.postal_code,
    country_code: input.business_country_code,
  })
}

export async function updateStoreLocationAddress(
  storeId: string,
  locationId: string | null,
  input: StoreAddressInput
): Promise<{
  location: StoreSettingsLocation
  store: StoreSettingsStore
}> {
  const address = {
    address_1: input.address_1.trim() || null,
    address_2: input.address_2.trim() || null,
    city: input.city.trim() || null,
    province: input.province.trim() || null,
    postal_code: input.postal_code.trim() || null,
    country_code: input.country_code.toLowerCase(),
  }

  const locationName = input.companyName.trim() || "Tienda"

  if (locationId) {
    const locationBody = await adminFetch<{
      stock_location: StoreSettingsLocation
    }>(`/admin/stock-locations/${locationId}`, {
      method: "POST",
      body: JSON.stringify({
        name: locationName,
        address,
      }),
    })

    const storesBody = await adminFetch<{ stores: StoreSettingsStore[] }>(
      "/admin/stores"
    )
    const store = storesBody.stores?.[0]

    if (!store) {
      throw new Error("No store found")
    }

    return {
      location: locationBody.stock_location,
      store,
    }
  }

  const created = await adminFetch<{ stock_location: StoreSettingsLocation }>(
    "/admin/stock-locations",
    {
      method: "POST",
      body: JSON.stringify({
        name: locationName,
        address,
      }),
    }
  )

  const storeBody = await adminFetch<{ store: StoreSettingsStore }>(
    `/admin/stores/${storeId}`,
    {
      method: "POST",
      body: JSON.stringify({
        default_location_id: created.stock_location.id,
      }),
    }
  )

  return {
    location: created.stock_location,
    store: storeBody.store,
  }
}

export function countryDisplayName(
  iso2: string | null | undefined
): string | null {
  if (!iso2) {
    return null
  }

  try {
    return (
      new Intl.DisplayNames(["es"], { type: "region" }).of(iso2.toUpperCase()) ??
      iso2.toUpperCase()
    )
  } catch {
    return iso2.toUpperCase()
  }
}
