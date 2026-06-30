import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useLayoutEffect } from "react"
import { StoreSettingsShopifyPage } from "../components/store-settings/StoreSettingsShopifyPage"
import { installAuthBridge } from "../lib/auth-bridge"
import {
  isStoreCurrencyManagementPage,
  isStoreSettingsPage,
  SKREPAY_ROUTE_CHANGE_EVENT,
} from "../lib/region-routes"

const BODY_FLAG = "data-skrepay-shopify-store"

const hideNativeStoreStyles = `
  body[${BODY_FLAG}] .flex.flex-col.gap-y-3 > [data-skrepay-store-shell] ~ * {
    display: none !important;
  }
`

function redirectStoreCurrenciesRoute() {
  const path = window.location.pathname.replace(/^\/app(?=\/|$)/, "") || "/"

  if (/\/settings\/store\/currencies\/?$/.test(path)) {
    window.history.replaceState({}, "", "/app/settings/store")
  }
}

function syncStoreSettingsShell() {
  const active = isStoreSettingsPage(window.location.pathname)

  if (!active) {
    document.body.removeAttribute(BODY_FLAG)
    return
  }

  document.body.setAttribute(BODY_FLAG, "true")
  redirectStoreCurrenciesRoute()
}

const StoreSettingsShopify = () => {
  useLayoutEffect(() => {
    installAuthBridge()

    const sync = () => {
      if (isStoreCurrencyManagementPage(window.location.pathname)) {
        syncStoreSettingsShell()
        return
      }

      syncStoreSettingsShell()
    }

    sync()

    const observer = new MutationObserver(sync)
    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener(SKREPAY_ROUTE_CHANGE_EVENT, sync)
    window.addEventListener("popstate", sync)

    return () => {
      observer.disconnect()
      window.removeEventListener(SKREPAY_ROUTE_CHANGE_EVENT, sync)
      window.removeEventListener("popstate", sync)
      document.body.removeAttribute(BODY_FLAG)
    }
  }, [])

  if (!isStoreSettingsPage(window.location.pathname)) {
    return <style>{hideNativeStoreStyles}</style>
  }

  return (
    <>
      <style>{hideNativeStoreStyles}</style>
      <StoreSettingsShopifyPage />
    </>
  )
}

export const config = defineWidgetConfig({
  zone: ["store.details.before"],
})

export default StoreSettingsShopify
