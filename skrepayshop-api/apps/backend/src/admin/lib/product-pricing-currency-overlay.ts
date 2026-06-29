import type { QueryClient } from "@tanstack/react-query"
import type { RegionFormCurrencyRow } from "./region-form-currency-overlay"
import {
  patchStoreCacheWithCurrencies,
  restoreStoreCache,
  snapshotStoreCache,
} from "./region-form-currency-overlay"
import { hideNonDefaultStoreCurrencyPriceColumns } from "./product-pricing-ui"

type CacheSnapshot = ReturnType<typeof snapshotStoreCache>

let storeSnapshot: CacheSnapshot | null = null
let overlayCurrencies: RegionFormCurrencyRow[] = []
let overlayDefaultCode = "usd"
let overlayActive = false

async function fetchStorePricingContext(): Promise<{
  currencies: RegionFormCurrencyRow[]
  defaultCode: string
}> {
  const response = await fetch(`/admin/stores?_ts=${Date.now()}`, {
    credentials: "include",
    cache: "no-store",
  })

  if (!response.ok) {
    return { currencies: [], defaultCode: "usd" }
  }

  const body = await response.json()
  const list = (body.stores?.[0]?.supported_currencies ??
    []) as RegionFormCurrencyRow[]

  if (!list.length) {
    return { currencies: [], defaultCode: "usd" }
  }

  const defaultCode =
    list.find((row) => row.is_default)?.currency_code ?? list[0].currency_code

  const reordered = [
    ...list.filter((row) => row.is_default),
    ...list.filter((row) => !row.is_default),
  ]

  return { currencies: reordered, defaultCode }
}

export function applyProductPricingUi(defaultCurrencyCode: string) {
  hideNonDefaultStoreCurrencyPriceColumns(defaultCurrencyCode)
}

export async function activateProductPricingCurrencyOverlay(
  queryClient: QueryClient
) {
  const { currencies, defaultCode } = await fetchStorePricingContext()

  if (!currencies.length) {
    return
  }

  if (!overlayActive) {
    storeSnapshot = snapshotStoreCache(queryClient)
  }

  overlayCurrencies = currencies
  overlayDefaultCode = defaultCode.toLowerCase()
  overlayActive = true
  patchStoreCacheWithCurrencies(queryClient, currencies)
  applyProductPricingUi(overlayDefaultCode)
}

export function deactivateProductPricingCurrencyOverlay(
  queryClient: QueryClient
) {
  if (storeSnapshot) {
    restoreStoreCache(queryClient, storeSnapshot)
  }

  storeSnapshot = null
  overlayCurrencies = []
  overlayDefaultCode = "usd"
  overlayActive = false
}

export function isProductPricingCurrencyOverlayActive() {
  return overlayActive
}

export function getProductPricingDefaultCurrencyCode() {
  return overlayDefaultCode
}

export function setProductPricingDefaultCurrencyCode(code: string) {
  overlayDefaultCode = code.toLowerCase()
  overlayActive = true
}
