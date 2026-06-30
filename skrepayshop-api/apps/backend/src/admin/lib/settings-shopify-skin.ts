import {
  isSettingsPage,
  SKREPAY_ROUTE_CHANGE_EVENT,
} from "./region-routes"
import { SETTINGS_SHELL_FLAG } from "./settings-shopify-skin-styles"

const MODAL_MARKER = "data-skrepay-shopify-modal"

declare global {
  interface Window {
    __skrepaySettingsShopifySkinInstalled?: boolean
    __skrepaySettingsShopifySkinSyncing?: boolean
  }
}

function applySettingsModalSkin() {
  if (!document.body.hasAttribute(SETTINGS_SHELL_FLAG)) {
    return
  }

  document
    .querySelectorAll("[data-vaul-drawer-direction], [role='dialog']")
    .forEach((node) => {
      if (!(node instanceof HTMLElement)) {
        return
      }

      if (node.getAttribute("data-state") === "closed") {
        node.removeAttribute(MODAL_MARKER)
        return
      }

      node.setAttribute(MODAL_MARKER, "true")
    })
}

export function syncSettingsShopifySkin() {
  if (typeof window === "undefined") {
    return
  }

  if (!isSettingsPage(window.location.pathname)) {
    document.body.removeAttribute(SETTINGS_SHELL_FLAG)
    return
  }

  document.body.setAttribute(SETTINGS_SHELL_FLAG, "true")
  applySettingsModalSkin()
}

export function installSettingsShopifySkin() {
  if (typeof window === "undefined") {
    return
  }

  syncSettingsShopifySkin()

  if (window.__skrepaySettingsShopifySkinInstalled) {
    return
  }

  window.__skrepaySettingsShopifySkinInstalled = true

  const scheduleSync = () => {
    if (window.__skrepaySettingsShopifySkinSyncing) {
      return
    }

    window.__skrepaySettingsShopifySkinSyncing = true
    window.requestAnimationFrame(() => {
      syncSettingsShopifySkin()
      window.__skrepaySettingsShopifySkinSyncing = false
    })
  }

  const observer = new MutationObserver((mutations) => {
    const relevant = mutations.some((mutation) => {
      const target = mutation.target

      if (!(target instanceof HTMLElement)) {
        return true
      }

      return !target.hasAttribute(MODAL_MARKER)
    })

    if (relevant) {
      scheduleSync()
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-state", "open"],
  })

  window.addEventListener(SKREPAY_ROUTE_CHANGE_EVENT, scheduleSync)
  window.addEventListener("popstate", scheduleSync)
}
