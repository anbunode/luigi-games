import type { QueryClient, QueryKey } from "@tanstack/react-query"

export type RegionFormCurrencyRow = {
  id: string
  currency_code: string
  is_default: boolean
  store_id: string
  currency?: {
    code: string
    symbol: string
    symbol_native: string
    name: string
    decimal_digits: number
    rounding?: number | string
  }
}

type StoreCacheSnapshot = Array<[QueryKey, unknown]>

let catalogSnapshot: StoreCacheSnapshot | null = null
let overlayCurrencies: RegionFormCurrencyRow[] = []
let overlayActive = false
let cacheUnsubscribe: (() => void) | null = null

export function isStoreQueryKey(queryKey: QueryKey): boolean {
  if (!Array.isArray(queryKey)) {
    return false
  }

  const [root, resource] = queryKey

  // Medusa Admin dashboard (useStore → storeQueryKeys.details() === ["store", "detail"])
  if (root === "store" && (resource === "detail" || resource === "list")) {
    return true
  }

  // Legacy / SDK-style keys
  if (root === "admin" && (resource === "store" || resource === "stores")) {
    return true
  }

  return false
}

export function snapshotStoreCache(queryClient: QueryClient): StoreCacheSnapshot {
  return queryClient.getQueriesData({
    predicate: (query) => isStoreQueryKey(query.queryKey),
  })
}

export function restoreStoreCache(
  queryClient: QueryClient,
  snapshot: StoreCacheSnapshot
) {
  for (const [key, data] of snapshot) {
    queryClient.setQueryData(key, data)
  }
}

function patchStoreRecord(
  store: Record<string, unknown>,
  currencies: RegionFormCurrencyRow[]
) {
  return {
    ...store,
    supported_currencies: currencies,
  }
}

export function patchStoreCacheWithCurrencies(
  queryClient: QueryClient,
  currencies: RegionFormCurrencyRow[]
) {
  queryClient.setQueriesData(
    {
      predicate: (query) => isStoreQueryKey(query.queryKey),
    },
    (old: unknown) => {
      if (!old || typeof old !== "object") {
        return old
      }

      const payload = old as Record<string, unknown>

      if (payload.store && typeof payload.store === "object") {
        return {
          ...payload,
          store: patchStoreRecord(
            payload.store as Record<string, unknown>,
            currencies
          ),
        }
      }

      if (Array.isArray(payload.stores)) {
        return {
          ...payload,
          stores: payload.stores.map((store) =>
            store && typeof store === "object"
              ? patchStoreRecord(store as Record<string, unknown>, currencies)
              : store
          ),
        }
      }

      if ("supported_currencies" in payload) {
        return patchStoreRecord(payload, currencies)
      }

      return old
    }
  )
}

async function fetchRegionFormCurrencies(): Promise<RegionFormCurrencyRow[]> {
  const response = await fetch(
    `/admin/skrepay/region-currencies?_ts=${Date.now()}`,
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

function watchStoreCache(queryClient: QueryClient) {
  cacheUnsubscribe?.()

  cacheUnsubscribe = queryClient.getQueryCache().subscribe((event) => {
    if (!overlayActive || overlayCurrencies.length === 0) {
      return
    }

    if (event.type !== "updated") {
      return
    }

    const query = event.query
    if (!isStoreQueryKey(query.queryKey)) {
      return
    }

    const data = query.state.data
    if (!data || typeof data !== "object") {
      return
    }

    const payload = data as Record<string, unknown>
    const store =
      payload.store && typeof payload.store === "object"
        ? (payload.store as Record<string, unknown>)
        : Array.isArray(payload.stores)
          ? (payload.stores[0] as Record<string, unknown> | undefined)
          : "supported_currencies" in payload
            ? payload
            : null

    const count = Array.isArray(store?.supported_currencies)
      ? store.supported_currencies.length
      : 0

    if (count < overlayCurrencies.length) {
      patchStoreCacheWithCurrencies(queryClient, overlayCurrencies)
    }
  })
}

function stopWatchingStoreCache() {
  cacheUnsubscribe?.()
  cacheUnsubscribe = null
}

export async function activateRegionFormCurrencyOverlay(
  queryClient: QueryClient
) {
  const currencies = await fetchRegionFormCurrencies()

  if (currencies.length === 0) {
    return
  }

  if (!overlayActive) {
    catalogSnapshot = snapshotStoreCache(queryClient)
  }

  overlayCurrencies = currencies
  overlayActive = true
  patchStoreCacheWithCurrencies(queryClient, currencies)
  watchStoreCache(queryClient)
}

export function deactivateRegionFormCurrencyOverlay(queryClient: QueryClient) {
  stopWatchingStoreCache()

  if (catalogSnapshot) {
    restoreStoreCache(queryClient, catalogSnapshot)
  }

  catalogSnapshot = null
  overlayCurrencies = []
  overlayActive = false
}

export function isRegionFormCurrencyOverlayActive() {
  return overlayActive
}
