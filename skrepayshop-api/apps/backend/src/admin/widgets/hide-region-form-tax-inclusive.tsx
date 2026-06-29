import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useLayoutEffect } from "react"
import { hideRegionTaxInclusivePricingUi } from "../lib/region-form-ui"
import {
  isRegionFormPage,
  SKREPAY_ROUTE_CHANGE_EVENT,
} from "../lib/region-routes"

const BODY_FLAG = "data-skrepay-hide-region-tax-inclusive"

function syncRegionFormUi() {
  if (!isRegionFormPage(window.location.pathname)) {
    document.body.removeAttribute(BODY_FLAG)
    return
  }

  document.body.setAttribute(BODY_FLAG, "true")
  hideRegionTaxInclusivePricingUi()
}

/**
 * Oculta "Precios con impuestos incluidos" en crear/editar región.
 */
const HideRegionFormTaxInclusive = () => {
  useLayoutEffect(() => {
    syncRegionFormUi()

    const observer = new MutationObserver(() => {
      syncRegionFormUi()
    })

    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener(SKREPAY_ROUTE_CHANGE_EVENT, syncRegionFormUi)
    window.addEventListener("popstate", syncRegionFormUi)

    return () => {
      observer.disconnect()
      window.removeEventListener(SKREPAY_ROUTE_CHANGE_EVENT, syncRegionFormUi)
      window.removeEventListener("popstate", syncRegionFormUi)
      document.body.removeAttribute(BODY_FLAG)
    }
  }, [])

  return null
}

export const config = defineWidgetConfig({
  zone: ["region.details.before", "region.details.after"],
})

export default HideRegionFormTaxInclusive
