import { getPlatformLoginUrl } from "./platform-url"
import {
  appendStoreCurrencyScope,
  notifyRouteChange,
  resolveStoreCurrencyScope,
} from "./store-currency-scope"

declare global {
  interface Window {
    __skrepayAuthBridgeInstalled?: boolean
  }
}

function getLogoutUrl() {
  return `${window.location.origin}/skrepay/logout`
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
    let url =
      typeof input === "string"
        ? input
        : input instanceof Request
          ? input.url
          : String(input)

    if (method === "GET" && url.includes("/admin/stores")) {
      const scope = resolveStoreCurrencyScope(window.location.pathname)
      url = appendStoreCurrencyScope(url, scope)

      if (typeof input === "string") {
        input = url
      } else if (input instanceof Request) {
        input = new Request(url, input)
      }
    }

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
