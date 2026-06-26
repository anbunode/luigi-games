import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect } from "react"
import { getPlatformLoginUrl } from "../lib/platform-url"

declare global {
  interface Window {
    __skrepayAuthBridgeInstalled?: boolean
  }
}

const PlatformAuthBridge = () => {
  useEffect(() => {
    const loginUrl = getPlatformLoginUrl()

    if (window.__skrepayAuthBridgeInstalled) {
      return
    }

    window.__skrepayAuthBridgeInstalled = true

    const originalFetch = window.fetch.bind(window)

    window.fetch = async (input, init) => {
      const response = await originalFetch(input, init)
      const method = (init?.method || "GET").toUpperCase()
      const url =
        typeof input === "string"
          ? input
          : input instanceof Request
            ? input.url
            : String(input)

      if (
        method === "DELETE" &&
        url.includes("/auth/session") &&
        response.ok
      ) {
        window.location.replace(loginUrl)
      }

      return response
    }
  }, [])

  return null
}

export const config = defineWidgetConfig({
  zone: ["order.list.before", "product.list.before", "store.details.before"],
})

export default PlatformAuthBridge
