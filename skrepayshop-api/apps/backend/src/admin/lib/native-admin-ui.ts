import { ORDERS_LOADING_FLAG, ORDERS_LOADER_ID } from "./orders-loading-overlay"
import { SKREPAY_THEME_MARKER } from "./skrepay-theme"
import {
  ORDERS_DETAIL_FLAG,
  ORDERS_LIST_FLAG,
} from "./orders-routes"
import {
  SETTINGS_LOADING_FLAG,
  SETTINGS_LOADER_ID,
} from "./settings-loading-overlay"

/**
 * When true, Skrepay visual overrides in the Medusa admin are disabled
 * and the default Medusa UI is shown. Backend bridges (auth, currencies, tax)
 * stay active.
 */
export const USE_NATIVE_MEDUSA_ADMIN_UI = true

export function isNativeMedusaAdminUiEnabled() {
  return USE_NATIVE_MEDUSA_ADMIN_UI
}

const VISUAL_BODY_FLAGS = [
  SETTINGS_LOADING_FLAG,
  ORDERS_LOADING_FLAG,
  "data-skrepay-shopify-settings-nav",
  "data-skrepay-settings-topbar",
  "data-skrepay-shopify-store",
  ORDERS_LIST_FLAG,
  ORDERS_DETAIL_FLAG,
  "data-skrepay-store-settings",
] as const

const VISUAL_ELEMENT_IDS = [
  SETTINGS_LOADER_ID,
  ORDERS_LOADER_ID,
  "skrepay-settings-sidebar-chrome",
  "skrepay-orders-native-styles",
  "skrepay-orders-loader-styles",
  "skrepay-settings-loader-styles",
] as const

const HIDDEN_NATIVE_ATTR = "data-skrepay-native-hidden"
const HIDDEN_PROFILE_ATTR = "data-skrepay-profile-hidden"
const HIDDEN_BREADCRUMB_ATTR = "data-skrepay-settings-breadcrumb-hidden"

export function cleanupSkrepayAdminVisualArtifacts() {
  if (typeof document === "undefined") {
    return
  }

  for (const flag of VISUAL_BODY_FLAGS) {
    document.body.removeAttribute(flag)
  }

  document.documentElement.classList.remove(SKREPAY_THEME_MARKER)

  for (const id of VISUAL_ELEMENT_IDS) {
    document.getElementById(id)?.remove()
  }

  document
    .querySelectorAll(`[${HIDDEN_NATIVE_ATTR}="true"]`)
    .forEach((element) => {
      if (element instanceof HTMLElement) {
        element.removeAttribute(HIDDEN_NATIVE_ATTR)
        element.style.removeProperty("display")
      }
    })

  for (const attr of [HIDDEN_PROFILE_ATTR, HIDDEN_BREADCRUMB_ATTR]) {
    document.querySelectorAll(`[${attr}="true"]`).forEach((element) => {
      if (element instanceof HTMLElement) {
        element.removeAttribute(attr)
        element.style.removeProperty("display")
      }
    })
  }

  document
    .querySelectorAll("[data-skrepay-orders-native-host]")
    .forEach((element) => {
      element.removeAttribute("data-skrepay-orders-native-host")
    })

  document
    .querySelectorAll("[data-skrepay-settings-nav-icon]")
    .forEach((element) => {
      element.remove()
    })

  document
    .querySelectorAll("[data-skrepay-settings-nav-link]")
    .forEach((element) => {
      element.removeAttribute("data-skrepay-settings-nav-link")
    })
}
