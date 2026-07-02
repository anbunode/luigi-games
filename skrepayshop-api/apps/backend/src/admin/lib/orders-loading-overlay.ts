import { SETTINGS_LOADER_LOGO_URL } from "./settings-loading-logo"
import {
  isOrderDetailPage,
  isOrdersListPage,
  isOrdersSectionPage,
} from "./orders-routes"

export const ORDERS_LOADING_FLAG = "data-skrepay-orders-loading"
export const ORDERS_LOADER_ID = "skrepay-orders-loader"

const MIN_LOADING_MS = 1800
const MAX_LOADING_MS = 6000

let loadingShownAt = 0
let hideTimer: ReturnType<typeof setTimeout> | null = null
let safetyTimer: ReturnType<typeof setTimeout> | null = null
let loaderStylesInstalled = false

function ensureLoaderStyles() {
  if (loaderStylesInstalled || typeof document === "undefined") {
    return
  }

  loaderStylesInstalled = true
  const style = document.createElement("style")
  style.setAttribute("data-skrepay-orders-loader-styles", "true")
  style.textContent = `
    @keyframes skrepay-orders-logo-blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.38; }
    }
    body[${ORDERS_LOADING_FLAG}] aside,
    body[${ORDERS_LOADING_FLAG}] main {
      visibility: hidden !important;
    }
    #${ORDERS_LOADER_ID} {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(180deg, #101210 0%, #0c0e0c 100%);
    }
    #${ORDERS_LOADER_ID} .skrepay-loader-logo {
      width: min(56vw, 240px);
      height: auto;
      animation: skrepay-orders-logo-blink 1.6s ease-in-out infinite;
      user-select: none;
      pointer-events: none;
    }
    #${ORDERS_LOADER_ID} .skrepay-loader-caption {
      margin-top: 1rem;
      font-size: 13px;
      color: rgba(123, 174, 138, 0.85);
      font-family: 'DM Sans', system-ui, sans-serif;
    }
  `
  document.head.appendChild(style)
}

function createOrdersLoader() {
  const loader = document.createElement("div")
  loader.id = ORDERS_LOADER_ID
  loader.setAttribute("role", "status")
  loader.setAttribute("aria-live", "polite")
  loader.setAttribute("aria-label", "Cargando pedidos")
  loader.innerHTML = `
    <img
      class="skrepay-loader-logo"
      src="${SETTINGS_LOADER_LOGO_URL}"
      alt="Skrepay"
      width="240"
      height="240"
      decoding="async"
      draggable="false"
    />
    <p class="skrepay-loader-caption">Cargando pedidos…</p>
  `
  return loader
}

function isOrdersLoaderVisible() {
  return document.body.hasAttribute(ORDERS_LOADING_FLAG)
}

export function showOrdersLoadingOverlay() {
  if (typeof window === "undefined" || !isOrdersSectionPage(window.location.pathname)) {
    return
  }

  if (!isOrdersLoaderVisible()) {
    loadingShownAt = Date.now()
  }

  ensureLoaderStyles()
  document.body.setAttribute(ORDERS_LOADING_FLAG, "true")

  if (!document.getElementById(ORDERS_LOADER_ID)) {
    document.body.appendChild(createOrdersLoader())
  }

  if (!safetyTimer) {
    safetyTimer = window.setTimeout(() => {
      safetyTimer = null
      scheduleHideOrdersLoadingOverlay()
    }, MAX_LOADING_MS)
  }
}

export function showOrdersLoadingOverlayIfNeeded() {
  if (shouldShowOrdersLoadingOverlay()) {
    showOrdersLoadingOverlay()
  }
}

export function scheduleHideOrdersLoadingOverlay() {
  if (!isOrdersLoaderVisible()) {
    return
  }

  const elapsed = Date.now() - loadingShownAt
  const remaining = Math.max(0, MIN_LOADING_MS - elapsed)

  if (hideTimer) {
    clearTimeout(hideTimer)
  }

  hideTimer = window.setTimeout(() => {
    hideOrdersLoadingOverlayImmediately()
  }, remaining)
}

export function hideOrdersLoadingOverlayImmediately() {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }

  if (safetyTimer) {
    clearTimeout(safetyTimer)
    safetyTimer = null
  }

  document.body.removeAttribute(ORDERS_LOADING_FLAG)
  document.getElementById(ORDERS_LOADER_ID)?.remove()
}

export function shouldShowOrdersLoadingOverlay() {
  if (!isOrdersSectionPage(window.location.pathname)) {
    return false
  }

  const listShell = document.querySelector("[data-skrepay-orders-shell]")
  const detailShell = document.querySelector("[data-skrepay-order-detail-shell]")

  if (isOrdersListPage(window.location.pathname)) {
    return !listShell
  }

  if (isOrderDetailPage(window.location.pathname)) {
    return !detailShell
  }

  return false
}
