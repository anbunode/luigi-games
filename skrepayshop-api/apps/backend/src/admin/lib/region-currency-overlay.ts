import type { QueryClient, QueryKey } from "@tanstack/react-query"

export type RegionCurrencyRow = {
  id: string
  currency_code: string
  is_default: boolean
  store_id: string
  created_at?: string | Date
  updated_at?: string | Date
  deleted_at?: string | Date | null
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
let overlayActive = false

function isStoreQueryKey(queryKey: QueryKey): boolean {
  if (!Array.isArray(queryKey)) {
    return false
  }

  const [root, resource] = queryKey

  return (
    root === "admin" && (resource === "store" || resource === "stores")
  )
}

function snapshotStoreCache(queryClient: QueryClient): StoreCacheSnapshot {
  return queryClient.getQueriesData({
    predicate: (query) => isStoreQueryKey(query.queryKey),
  })
}

function restoreStoreCache(
  queryClient: QueryClient,
  snapshot: StoreCacheSnapshot
) {
  for (const [key, data] of snapshot) {
    queryClient.setQueryData(key, data)
  }
}

function patchStoreRecord(
  store: Record<string, unknown>,
  currencies: RegionCurrencyRow[]
) {
  return {
    ...store,
    supported_currencies: currencies,
  }
}

function patchStoreCacheWithCurrencies(
  queryClient: QueryClient,
  currencies: RegionCurrencyRow[]
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

async function fetchRegionCurrencies(): Promise<RegionCurrencyRow[]> {
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

export async function activateRegionCurrencyOverlay(
  queryClient: QueryClient
) {
  if (overlayActive) {
    return
  }

  catalogSnapshot = snapshotStoreCache(queryClient)
  const currencies = await fetchRegionCurrencies()

  if (currencies.length > 0) {
    patchStoreCacheWithCurrencies(queryClient, currencies)
    overlayActive = true
  }
}

export async function deactivateRegionCurrencyOverlay(
  queryClient: QueryClient,
  options?: { refetchCatalog?: boolean }
) {
  if (!overlayActive && !catalogSnapshot) {
    if (options?.refetchCatalog) {
      await refetchStoreCatalog(queryClient)
    }
    return
  }

  if (catalogSnapshot) {
    restoreStoreCache(queryClient, catalogSnapshot)
  }

  catalogSnapshot = null
  overlayActive = false

  if (options?.refetchCatalog) {
    await refetchStoreCatalog(queryClient)
  }
}

export async function refetchStoreCatalog(queryClient: QueryClient) {
  await queryClient.invalidateQueries({
    predicate: (query) => isStoreQueryKey(query.queryKey),
  })
  await queryClient.refetchQueries({
    predicate: (query) => isStoreQueryKey(query.queryKey),
    type: "active",
  })
}

export function isRegionCurrencyOverlayActive() {
  return overlayActive
}
