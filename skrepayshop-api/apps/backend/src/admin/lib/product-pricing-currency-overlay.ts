import type { QueryClient, QueryKey } from "@tanstack/react-query"
import type { RegionFormCurrencyRow } from "./region-form-currency-overlay"
import {
  isStoreQueryKey,
  patchStoreCacheWithCurrencies,
  restoreStoreCache,
  snapshotStoreCache,
} from "./region-form-currency-overlay"

type CacheSnapshot = Array<[QueryKey, unknown]>

let storeSnapshot: CacheSnapshot | null = null
let regionsSnapshot: CacheSnapshot | null = null
let overlayCurrencies: RegionFormCurrencyRow[] = []
let overlayActive = false

function isRegionsListQueryKey(queryKey: QueryKey): boolean {
  return (
    Array.isArray(queryKey) &&
    queryKey[0] === "regions" &&
    queryKey[1] === "list"
  )
}

function snapshotRegionsCache(queryClient: QueryClient): CacheSnapshot {
  return queryClient.getQueriesData({
    predicate: (query) => isRegionsListQueryKey(query.queryKey),
  })
}

function patchRegionsCacheEmpty(queryClient: QueryClient) {
  queryClient.setQueriesData(
    {
      predicate: (query) => isRegionsListQueryKey(query.queryKey),
    },
    (old: unknown) => {
      if (!old || typeof old !== "object") {
        return {
          regions: [],
          count: 0,
          offset: 0,
          limit: 0,
        }
      }

      return {
        ...(old as Record<string, unknown>),
        regions: [],
        count: 0,
      }
    }
  )
}

function restoreRegionsCache(queryClient: QueryClient, snapshot: CacheSnapshot) {
  for (const [key, data] of snapshot) {
    queryClient.setQueryData(key, data)
  }
}

async function fetchProductPricingCurrencies(): Promise<RegionFormCurrencyRow[]> {
  const response = await fetch(
    `/admin/skrepay/pricing-currencies?_ts=${Date.now()}`,
    {
      credentials: "include",
      cache: "no-store",
    }
  )

  if (!response.ok) {
    return []
  }

  const body = await response.json()
  return body.supported_currencies ?? []
}

export async function activateProductPricingCurrencyOverlay(
  queryClient: QueryClient
) {
  const currencies = await fetchProductPricingCurrencies()

  if (currencies.length === 0) {
    return
  }

  if (!overlayActive) {
    storeSnapshot = snapshotStoreCache(queryClient)
    regionsSnapshot = snapshotRegionsCache(queryClient)
  }

  overlayCurrencies = currencies
  overlayActive = true
  patchStoreCacheWithCurrencies(queryClient, currencies)
  patchRegionsCacheEmpty(queryClient)
}

export function deactivateProductPricingCurrencyOverlay(
  queryClient: QueryClient
) {
  if (storeSnapshot) {
    restoreStoreCache(queryClient, storeSnapshot)
  }

  if (regionsSnapshot) {
    restoreRegionsCache(queryClient, regionsSnapshot)
  }

  storeSnapshot = null
  regionsSnapshot = null
  overlayCurrencies = []
  overlayActive = false
}

export function isProductPricingCurrencyOverlayActive() {
  return overlayActive
}
