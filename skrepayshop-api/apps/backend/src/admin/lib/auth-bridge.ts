import { getPlatformLoginUrl } from "./platform-url"
import {
  resolveStoreCurrencyScope,
  STORE_CURRENCY_SCOPE_HEADER,
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

function shouldAttachCurrencyScope(url: string, method: string) {
  return method === "GET" && /\/admin\/stores(\/|$|\?)/.test(url)
}

function withCurrencyScopeHeader(init?: RequestInit): RequestInit {
  const scope = resolveStoreCurrencyScope(window.location.pathname)
  const headers = new Headers(init?.headers ?? {})

  if (!headers.has(STORE_CURRENCY_SCOPE_HEADER)) {
    headers.set(STORE_CURRENCY_SCOPE_HEADER, scope)
  }

  return { ...init, headers }
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

    let requestInput: RequestInfo | URL = input
    let requestInit = init

    if (shouldAttachCurrencyScope(url, method)) {
      if (input instanceof Request) {
        const headers = new Headers(input.headers)
        if (!headers.has(STORE_CURRENCY_SCOPE_HEADER)) {
          headers.set(
            STORE_CURRENCY_SCOPE_HEADER,
            resolveStoreCurrencyScope(window.location.pathname)
          )
        }
        requestInput = new Request(input, { headers })
      } else {
        requestInit = withCurrencyScopeHeader(init)
      }
    }

    const response = await originalFetch(requestInput, requestInit)

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
