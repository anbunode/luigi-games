import type { QueryClient } from "@tanstack/react-query"
import {
  activateProductPricingCurrencyOverlay,
  applyProductPricingUi,
  deactivateProductPricingCurrencyOverlay,
  getProductPricingDefaultCurrencyCode,
  setProductPricingDefaultCurrencyCode,
} from "./product-pricing-currency-overlay"
import {
  isProductPricingPage,
  SKREPAY_ROUTE_CHANGE_EVENT,
} from "./region-routes"

declare global {
  interface Window {
    __skrepayProductPricingBridgeInstalled?: boolean
  }
}

let pricingObserver: MutationObserver | null = null
let pricingQueryClient: QueryClient | null = null
let pricingDomScheduled = false

function schedulePricingDomPass() {
  if (pricingDomScheduled || typeof window === "undefined") {
    return
  }

  pricingDomScheduled = true

  requestAnimationFrame(() => {
    pricingDomScheduled = false

    if (!isProductPricingPage(window.location.pathname)) {
      return
    }

    applyProductPricingUi(getProductPricingDefaultCurrencyCode())
  })
}

function syncProductPricingBridge() {
  if (typeof window === "undefined") {
    return
  }

  if (isProductPricingPage(window.location.pathname)) {
    if (pricingQueryClient) {
      void activateProductPricingCurrencyOverlay(pricingQueryClient)
    } else {
      void activateProductPricingCurrencyOverlayWithoutQueryClient()
    }

    schedulePricingDomPass()
    return
  }

  if (pricingQueryClient) {
    deactivateProductPricingCurrencyOverlay(pricingQueryClient)
  }
}

async function activateProductPricingCurrencyOverlayWithoutQueryClient() {
  const response = await fetch(`/admin/stores?_ts=${Date.now()}`, {
    credentials: "include",
    cache: "no-store",
  })

  if (!response.ok) {
    return
  }

  const body = await response.json()
  const list = body.stores?.[0]?.supported_currencies ?? []
  const defaultCode =
    list.find((row: { is_default?: boolean }) => row.is_default)
      ?.currency_code ?? list[0]?.currency_code ?? "usd"

  setProductPricingDefaultCurrencyCode(defaultCode)
  applyProductPricingUi(defaultCode)
}

export function registerProductPricingQueryClient(queryClient: QueryClient) {
  pricingQueryClient = queryClient
  syncProductPricingBridge()
}

export function installProductPricingBridge() {
  if (typeof window === "undefined" || window.__skrepayProductPricingBridgeInstalled) {
    return
  }

  window.__skrepayProductPricingBridgeInstalled = true

  syncProductPricingBridge()

  window.addEventListener(SKREPAY_ROUTE_CHANGE_EVENT, syncProductPricingBridge)
  window.addEventListener("popstate", syncProductPricingBridge)

  pricingObserver = new MutationObserver(() => {
    schedulePricingDomPass()
  })

  pricingObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-column-index", "role"],
  })
}
