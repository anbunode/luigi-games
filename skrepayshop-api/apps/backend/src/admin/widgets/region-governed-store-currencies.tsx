import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useLayoutEffect } from "react"
import {
  isStoreCurrencyManagementPage,
  SKREPAY_ROUTE_CHANGE_EVENT,
} from "../lib/region-routes"

const hideAddCurrenciesStyles = `
  body[data-skrepay-region-store-currencies] a[href$="/currencies"],
  body[data-skrepay-region-store-currencies] a[href="currencies"] {
    display: none !important;
  }
`

function syncStoreCurrencyGovernance() {
  if (isStoreCurrencyManagementPage(window.location.pathname)) {
    document.body.setAttribute("data-skrepay-region-store-currencies", "true")

    if (/\/settings\/store\/currencies\/?$/.test(
      window.location.pathname.replace(/^\/app(?=\/|$)/, "") || "/"
    )) {
      window.history.replaceState({}, "", "/app/settings/store")
    }
    return
  }

  document.body.removeAttribute("data-skrepay-region-store-currencies")
}

/**
 * Las monedas de tienda las gobiernan las regiones; oculta "Agregar moneda".
 */
const RegionGovernedStoreCurrencies = () => {
  useLayoutEffect(() => {
    syncStoreCurrencyGovernance()

    const observer = new MutationObserver(() => {
      syncStoreCurrencyGovernance()
    })

    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener(SKREPAY_ROUTE_CHANGE_EVENT, syncStoreCurrencyGovernance)
    window.addEventListener("popstate", syncStoreCurrencyGovernance)

    return () => {
      observer.disconnect()
      window.removeEventListener(SKREPAY_ROUTE_CHANGE_EVENT, syncStoreCurrencyGovernance)
      window.removeEventListener("popstate", syncStoreCurrencyGovernance)
      document.body.removeAttribute("data-skrepay-region-store-currencies")
    }
  }, [])

  return <style>{hideAddCurrenciesStyles}</style>
}

export const config = defineWidgetConfig({
  zone: ["store.details.before", "store.details.after"],
})

export default RegionGovernedStoreCurrencies
