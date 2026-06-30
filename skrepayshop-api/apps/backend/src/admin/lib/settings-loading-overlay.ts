import { isSettingsPage } from "./region-routes"

export const SETTINGS_LOADING_FLAG = "data-skrepay-settings-loading"
export const SETTINGS_LOADER_ID = "skrepay-settings-loader"

const MIN_LOADING_MS = 2500

let loadingShownAt = 0
let hideTimer: ReturnType<typeof setTimeout> | null = null
let loaderStylesInstalled = false

function ensureLoaderStyles() {
  if (loaderStylesInstalled || typeof document === "undefined") {
    return
  }

  loaderStylesInstalled = true
  const style = document.createElement("style")
  style.setAttribute("data-skrepay-settings-loader-styles", "true")
  style.textContent = `
    @keyframes skrepay-settings-spin {
      to { transform: rotate(360deg); }
    }
    body[${SETTINGS_LOADING_FLAG}] aside,
    body[${SETTINGS_LOADING_FLAG}] main {
      visibility: hidden !important;
    }
  `
  document.head.appendChild(style)
}

function isSettingsLoaderVisible() {
  return document.body.hasAttribute(SETTINGS_LOADING_FLAG)
}

export function showSettingsLoadingOverlay() {
  if (typeof window === "undefined" || !isSettingsPage(window.location.pathname)) {
    return
  }

  if (!isSettingsLoaderVisible()) {
    loadingShownAt = Date.now()
  }

  ensureLoaderStyles()
  document.body.setAttribute(SETTINGS_LOADING_FLAG, "true")

  let loader = document.getElementById(SETTINGS_LOADER_ID)

  if (!loader) {
    loader = document.createElement("div")
    loader.id = SETTINGS_LOADER_ID
    loader.setAttribute("role", "status")
    loader.setAttribute("aria-live", "polite")
    loader.style.cssText =
      "position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#111111;"
    loader.innerHTML = `
      <div data-skrepay-spinner class="skrepay-settings-spinner" aria-hidden="true" style="width:2rem;height:2rem;border-radius:9999px;border:2px solid rgba(255,255,255,0.12);border-top-color:rgba(255,255,255,0.88);animation:skrepay-settings-spin 0.8s linear infinite;"></div>
      <p class="skrepay-settings-loader-text" style="margin-top:1rem;font-size:0.875rem;color:rgba(255,255,255,0.55);">Cargando configuración…</p>
    `
    document.body.appendChild(loader)
  }
}

export function scheduleHideSettingsLoadingOverlay() {
  if (!isSettingsLoaderVisible()) {
    return
  }

  const elapsed = Date.now() - loadingShownAt
  const remaining = Math.max(0, MIN_LOADING_MS - elapsed)

  if (hideTimer) {
    clearTimeout(hideTimer)
  }

  hideTimer = window.setTimeout(() => {
    hideSettingsLoadingOverlayImmediately()
  }, remaining)
}

export function hideSettingsLoadingOverlayImmediately() {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }

  document.body.removeAttribute(SETTINGS_LOADING_FLAG)
  document.getElementById(SETTINGS_LOADER_ID)?.remove()
}

export function shouldShowSettingsLoadingOverlay() {
  if (!isSettingsPage(window.location.pathname)) {
    return false
  }

  const aside = document.querySelector('aside nav a[href*="/settings/"]')

  return (
    !document.body.hasAttribute("data-skrepay-shopify-settings-nav") ||
    !document.getElementById("skrepay-settings-sidebar-chrome") ||
    !aside?.closest("aside")?.querySelector("[data-skrepay-settings-nav-icon]")
  )
}
