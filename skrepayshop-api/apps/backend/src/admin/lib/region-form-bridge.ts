import type { QueryClient } from "@tanstack/react-query"
import {
  activateRegionFormCurrencyOverlay,
  deactivateRegionFormCurrencyOverlay,
} from "./region-form-currency-overlay"
import {
  hideRegionTaxInclusivePricingUi,
  patchRegionFormCurrencySelectLabels,
} from "./region-form-ui"
import { isRegionFormPage, SKREPAY_ROUTE_CHANGE_EVENT } from "./region-routes"

declare global {
  interface Window {
    __skrepayRegionFormBridgeInstalled?: boolean
  }
}

let regionFormQueryClient: QueryClient | null = null
let regionFormObserver: MutationObserver | null = null
let regionFormDomScheduled = false

function scheduleRegionFormDomPass() {
  if (regionFormDomScheduled || typeof window === "undefined") {
    return
  }

  regionFormDomScheduled = true

  requestAnimationFrame(() => {
    regionFormDomScheduled = false

    if (!isRegionFormPage(window.location.pathname)) {
      document.body.removeAttribute("data-skrepay-region-form")
      return
    }

    document.body.setAttribute("data-skrepay-region-form", "true")
    hideRegionTaxInclusivePricingUi()
    patchRegionFormCurrencySelectLabels()
  })
}

function syncRegionFormBridge() {
  if (typeof window === "undefined") {
    return
  }

  if (isRegionFormPage(window.location.pathname)) {
    if (regionFormQueryClient) {
      void activateRegionFormCurrencyOverlay(regionFormQueryClient)
    }

    scheduleRegionFormDomPass()
    return
  }

  document.body.removeAttribute("data-skrepay-region-form")

  if (regionFormQueryClient) {
    deactivateRegionFormCurrencyOverlay(regionFormQueryClient)
  }
}

export function registerRegionFormQueryClient(queryClient: QueryClient) {
  regionFormQueryClient = queryClient
  syncRegionFormBridge()
}

export function installRegionFormUiBridge() {
  if (typeof window === "undefined" || window.__skrepayRegionFormBridgeInstalled) {
    return
  }

  window.__skrepayRegionFormBridgeInstalled = true

  syncRegionFormBridge()

  window.addEventListener(SKREPAY_ROUTE_CHANGE_EVENT, syncRegionFormBridge)
  window.addEventListener("popstate", syncRegionFormBridge)

  regionFormObserver = new MutationObserver(() => {
    scheduleRegionFormDomPass()
  })

  regionFormObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-state", "aria-selected", "data-value"],
  })
}
