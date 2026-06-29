import { getPlatformLoginUrl } from "./platform-url"
import { isRegionFormPage, notifyRouteChange } from "./region-routes"

declare global {
  interface Window {
    __skrepayAuthBridgeInstalled?: boolean
  }
}

function getLogoutUrl() {
  return `${window.location.origin}/skrepay/logout`
}

function isAdminStoresRequest(method: string, url: string): boolean {
  if (method !== "GET") {
    return false
  }

  try {
    const parsed = new URL(url, window.location.origin)
    return /^\/admin\/stores\/?$/.test(parsed.pathname)
  } catch {
    return url.includes("/admin/stores") && !url.includes("/admin/stores/")
  }
}

async function patchStoreListWithRegionCatalog(
  response: Response,
  originalFetch: typeof fetch
): Promise<Response> {
  if (!response.ok) {
    return response
  }

  const catalogResponse = await originalFetch(
    `/admin/skrepay/region-currencies?_ts=${Date.now()}`,
    {
      credentials: "include",
      cache: "no-store",
    }
  )

  if (!catalogResponse.ok) {
    return response
  }

  const [storeBody, catalogBody] = await Promise.all([
    response.json(),
    catalogResponse.json(),
  ])

  const catalog = catalogBody.supported_currencies
  if (!Array.isArray(catalog) || catalog.length === 0) {
    return new Response(JSON.stringify(storeBody), {
      status: response.status,
      headers: response.headers,
    })
  }

  const patchStore = (store: Record<string, unknown>) => ({
    ...store,
    supported_currencies: catalog,
  })

  const patched =
    storeBody && typeof storeBody === "object"
      ? {
          ...(storeBody as Record<string, unknown>),
          ...(Array.isArray((storeBody as { stores?: unknown[] }).stores)
            ? {
                stores: (storeBody as { stores: Record<string, unknown>[] }).stores.map(
                  (store) => patchStore(store)
                ),
              }
            : {}),
          ...((storeBody as { store?: Record<string, unknown> }).store
            ? {
                store: patchStore(
                  (storeBody as { store: Record<string, unknown> }).store
                ),
              }
            : {}),
        }
      : storeBody

  return new Response(JSON.stringify(patched), {
    status: response.status,
    headers: response.headers,
  })
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

    if (
      isRegionFormPage(window.location.pathname) &&
      isAdminStoresRequest(method, url)
    ) {
      const headers = new Headers(init?.headers)
      headers.set("x-skrepay-region-form", "1")
      const patchedInit = {
        ...init,
        headers,
      }
      const response = await originalFetch(input, patchedInit)
      return patchStoreListWithRegionCatalog(response, originalFetch)
    }

    const response = await originalFetch(input, init)

    if (
      method === "DELETE" &&
      url.includes("/auth/session") &&
      response.ok
    ) {
      window.location.replace(logoutUrl)
    }

    return response
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
