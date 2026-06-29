import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useLayoutEffect } from "react"
import { hideStoreCurrencyTaxInclusiveUi } from "../lib/store-currency-tax-ui"
import {
  isStoreCurrencyManagementPage,
  SKREPAY_ROUTE_CHANGE_EVENT,
} from "../lib/region-routes"

const BODY_FLAG = "data-skrepay-hide-store-currency-tax"

function syncStoreCurrencyTaxUi() {
  if (!isStoreCurrencyManagementPage(window.location.pathname)) {
    document.body.removeAttribute(BODY_FLAG)
    return
  }

  document.body.setAttribute(BODY_FLAG, "true")
  hideStoreCurrencyTaxInclusiveUi()
}

/**
 * Los impuestos incluidos se configuran por región (país), no por moneda de tienda.
 * Oculta la columna y acciones en Tienda → Monedas sin tocar regiones.
 */
const HideStoreCurrencyTaxInclusive = () => {
  useLayoutEffect(() => {
    syncStoreCurrencyTaxUi()

    const observer = new MutationObserver(() => {
      syncStoreCurrencyTaxUi()
    })

    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener(SKREPAY_ROUTE_CHANGE_EVENT, syncStoreCurrencyTaxUi)
    window.addEventListener("popstate", syncStoreCurrencyTaxUi)

    return () => {
      observer.disconnect()
      window.removeEventListener(SKREPAY_ROUTE_CHANGE_EVENT, syncStoreCurrencyTaxUi)
      window.removeEventListener("popstate", syncStoreCurrencyTaxUi)
      document.body.removeAttribute(BODY_FLAG)
    }
  }, [])

  return null
}

export const config = defineWidgetConfig({
  zone: [
    "store.details.before",
    "store.details.after",
    "order.list.before",
    "product.list.before",
  ],
})

export default HideStoreCurrencyTaxInclusive
