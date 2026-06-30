import {
  applyStoreEditUi,
  clearStoreEditUi,
  resetLocalCurrencyTaxCache,
} from "./store-edit-ui"
import { isStoreEditPage, SKREPAY_ROUTE_CHANGE_EVENT } from "./region-routes"

declare global {
  interface Window {
    __skrepayStoreEditBridgeInstalled?: boolean
  }
}

let storeEditObserver: MutationObserver | null = null
let storeEditDomScheduled = false

function scheduleStoreEditDomPass() {
  if (storeEditDomScheduled || typeof window === "undefined") {
    return
  }

  storeEditDomScheduled = true

  requestAnimationFrame(() => {
    storeEditDomScheduled = false

    if (!isStoreEditPage(window.location.pathname)) {
      clearStoreEditUi()
      return
    }

    void applyStoreEditUi()
  })
}

function syncStoreEditBridge() {
  if (typeof window === "undefined") {
    return
  }

  if (isStoreEditPage(window.location.pathname)) {
    resetLocalCurrencyTaxCache()
    scheduleStoreEditDomPass()
    return
  }

  clearStoreEditUi()
}

export function installStoreEditUiBridge() {
  if (typeof window === "undefined" || window.__skrepayStoreEditBridgeInstalled) {
    return
  }

  window.__skrepayStoreEditBridgeInstalled = true

  syncStoreEditBridge()

  window.addEventListener(SKREPAY_ROUTE_CHANGE_EVENT, syncStoreEditBridge)
  window.addEventListener("popstate", syncStoreEditBridge)

  storeEditObserver = new MutationObserver(() => {
    scheduleStoreEditDomPass()
  })

  storeEditObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-state", "class"],
  })
}
