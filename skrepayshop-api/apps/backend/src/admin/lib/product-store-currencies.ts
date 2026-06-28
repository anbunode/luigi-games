import type { QueryClient } from "@tanstack/react-query"

export type PricingCurrencyRow = {
  id: string
  currency_code: string
  is_default: boolean
  store_id: string
  created_at?: string | Date
  updated_at?: string | Date
  deleted_at?: string | Date | null
}

function patchStoreRecord(
  store: Record<string, unknown>,
  currencies: PricingCurrencyRow[]
) {
  return {
    ...store,
    supported_currencies: currencies,
  }
}

export function patchStoreCacheWithPricingCurrencies(
  queryClient: QueryClient,
  currencies: PricingCurrencyRow[]
) {
  queryClient.setQueriesData(
    {
      predicate: (query) => {
        if (!Array.isArray(query.queryKey)) {
          return false
        }

        const [root, resource] = query.queryKey

        return (
          root === "admin" &&
          (resource === "store" || resource === "stores")
        )
      },
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

export async function fetchProductPricingCurrencies(): Promise<
  PricingCurrencyRow[]
> {
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

export async function applyProductPricingCurrenciesToCache(
  queryClient: QueryClient
) {
  const currencies = await fetchProductPricingCurrencies()
  patchStoreCacheWithPricingCurrencies(queryClient, currencies)
  return currencies
}
