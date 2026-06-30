import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useLayoutEffect } from "react"
import { SKREPAY_ROUTE_CHANGE_EVENT } from "../lib/region-routes"

const PROFILE_PATH = /\/settings\/profile(?:\/|$)/

function normalizePath(pathname: string) {
  return pathname.replace(/^\/app(?=\/|$)/, "") || "/"
}

function redirectProfileRoute() {
  const path = normalizePath(window.location.pathname)

  if (PROFILE_PATH.test(path)) {
    window.history.replaceState({}, "", "/app/settings/store")
  }
}

const HideProfileSettings = () => {
  useLayoutEffect(() => {
    redirectProfileRoute()

    const sync = () => {
      redirectProfileRoute()
    }

    window.addEventListener(SKREPAY_ROUTE_CHANGE_EVENT, sync)
    window.addEventListener("popstate", sync)

    return () => {
      window.removeEventListener(SKREPAY_ROUTE_CHANGE_EVENT, sync)
      window.removeEventListener("popstate", sync)
    }
  }, [])

  return null
}

export const config = defineWidgetConfig({
  zone: [
    "store.details.before",
    "order.list.before",
    "product.list.before",
    "region.list.before",
  ],
})

export default HideProfileSettings
