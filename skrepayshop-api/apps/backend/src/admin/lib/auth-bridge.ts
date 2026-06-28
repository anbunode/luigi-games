import { getPlatformLoginUrl } from "./platform-url"
import {
  isPricingContext,
  normalizeAdminPathname,
  notifyRouteChange,
} from "./store-currency-scope"

declare global {
  interface Window {
    __skrepayAuthBridgeInstalled?: boolean
  }
}

function getLogoutUrl() {
  return `${window.location.origin}/skrepay/logout`
}

function isStoreApiUrl(url: string) {
  return /\/admin\/stores(\/|$|\?)/.test(url)
}

function readAuthHeaders(init?: RequestInit, input?: RequestInfo | URL): Headers {
  const headers = new Headers(init?.headers ?? undefined)

  if (input instanceof Request) {
    input.headers.forEach((value, key) => {
      if (!headers.has(key)) {
        headers.set(key, value)
      }
    })
  }

  return headers
}

async function loadPricingCurrencies(
  originalFetch: typeof fetch,
  authHeaders: Headers
) {
  const headers = new Headers(authHeaders)
  const response = await originalFetch(
    `/admin/skrepay/pricing-currencies?_ts=${Date.now()}`,
    {
      method: "GET",
      credentials: "include",
      headers,
      cache: "no-store",
    }
  )

  if (!response.ok) {
    return []
  }

  const body = await response.json()
  return body.supported_currencies ?? []
}

function patchStorePayload(
  body: Record<string, unknown>,
  pricingCurrencies: unknown[]
) {
  if (Array.isArray(body.stores)) {
    return {
      ...body,
      stores: body.stores.map((store) =>
        store && typeof store === "object"
          ? { ...store, supported_currencies: pricingCurrencies }
          : store
      ),
    }
  }

  if (body.store && typeof body.store === "object") {
    return {
      ...body,
      store: {
        ...(body.store as Record<string, unknown>),
        supported_currencies: pricingCurrencies,
      },
    }
  }

  return body
}

export function installAuthBridge() {
  if (typeof window === "undefined" || window.__skrepayAuthBridgeInstalled) {
    return
  }

  window.__skrepayAuthBridgeInstalled = true

  const loginUrl = getPlatformLoginUrl()
  const logoutUrl = getLogoutUrl()
  const originalFetch = window.fetch.bind(window)

  window.fetch = async (input, init) => {
    const method = (init?.method || "GET").toUpperCase()
    const url =
      typeof input === "string"
        ? input
        : input instanceof Request
          ? input.url
          : String(input)

    if (method === "DELETE" && url.includes("/auth/session")) {
      window.location.replace(logoutUrl)
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    const response = await originalFetch(input, init)

    if (
      method === "DELETE" &&
      url.includes("/auth/session") &&
      response.ok
    ) {
      window.location.replace(logoutUrl)
    }

    const shouldPatchStoreCurrencies =
      method === "GET" &&
      isStoreApiUrl(url) &&
      isPricingContext(normalizeAdminPathname(window.location.pathname)) &&
      response.ok

    if (!shouldPatchStoreCurrencies) {
      return response
    }

    try {
      const body = (await response.clone().json()) as Record<string, unknown>
      const authHeaders = readAuthHeaders(init, input)
      const pricingCurrencies = await loadPricingCurrencies(
        originalFetch,
        authHeaders
      )
      const patched = patchStorePayload(body, pricingCurrencies)
      const headers = new Headers(response.headers)
      headers.set("Content-Type", "application/json")

      return new Response(JSON.stringify(patched), {
        status: response.status,
        statusText: response.statusText,
        headers,
      })
    } catch {
      return response
    }
  }

  const blockLoginNavigation = (target: string | URL | null | undefined) => {
    if (!target) {
      return false
    }

    return String(target).includes("/login")
  }

  const originalPushState = history.pushState.bind(history)
  history.pushState = ((...args: Parameters<History["pushState"]>) => {
    if (blockLoginNavigation(args[2])) {
      window.location.replace(loginUrl)
      return
    }
    const result = originalPushState(...args)
    notifyRouteChange()
    return result
  }) as History["pushState"]

  const originalReplaceState = history.replaceState.bind(history)
  history.replaceState = ((...args: Parameters<History["replaceState"]>) => {
    if (blockLoginNavigation(args[2])) {
      window.location.replace(loginUrl)
      return
    }
    const result = originalReplaceState(...args)
    notifyRouteChange()
    return result
  }) as History["replaceState"]
}
