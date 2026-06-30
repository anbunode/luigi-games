import { SETTINGS_LOADER_LOGO_URL } from "./settings-loading-logo"
import { isSettingsPage } from "./region-routes"

export const SETTINGS_LOADING_FLAG = "data-skrepay-settings-loading"
export const SETTINGS_LOADER_ID = "skrepay-settings-loader"

const MIN_LOADING_MS = 2500
const ADMIN_THEME_STORAGE_KEY = "medusa_admin_theme"

type AdminThemeValue = "light" | "dark"

type LoaderThemeColors = {
  bg: string
  fgMuted: string
}

const FALLBACK_THEME_COLORS: Record<AdminThemeValue, LoaderThemeColors> = {
  light: {
    bg: "rgba(255, 255, 255, 1)",
    fgMuted: "rgba(113, 113, 122, 1)",
  },
  dark: {
    bg: "rgba(33, 33, 36, 1)",
    fgMuted: "rgba(113, 113, 122, 1)",
  },
}

let loadingShownAt = 0
let hideTimer: ReturnType<typeof setTimeout> | null = null
let loaderStylesInstalled = false

export function resolveAdminThemeValue(): AdminThemeValue {
  const html = document.documentElement

  if (html.classList.contains("dark")) {
    return "dark"
  }

  if (html.classList.contains("light")) {
    return "light"
  }

  try {
    const stored = localStorage.getItem(ADMIN_THEME_STORAGE_KEY) as
      | "light"
      | "dark"
      | "system"
      | null

    if (stored === "dark") {
      return "dark"
    }

    if (stored === "light") {
      return "light"
    }
  } catch {
    // ignore storage errors
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function readAdminThemeColors(): LoaderThemeColors {
  const rootStyles = getComputedStyle(document.documentElement)
  const bg = rootStyles.getPropertyValue("--bg-base").trim()

  if (bg) {
    return {
      bg: "var(--bg-base)",
      fgMuted: "var(--fg-muted)",
    }
  }

  return FALLBACK_THEME_COLORS[resolveAdminThemeValue()]
}

function syncLoaderTheme(loader: HTMLElement) {
  const theme = resolveAdminThemeValue()
  const colors = readAdminThemeColors()

  loader.setAttribute("data-skrepay-theme", theme)
  loader.style.colorScheme = theme
  loader.style.backgroundColor = colors.bg
}

function ensureLoaderStyles() {
  if (loaderStylesInstalled || typeof document === "undefined") {
    return
  }

  loaderStylesInstalled = true
  const style = document.createElement("style")
  style.setAttribute("data-skrepay-settings-loader-styles", "true")
  style.textContent = `
    @keyframes skrepay-logo-blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.38; }
    }
    body[${SETTINGS_LOADING_FLAG}] aside,
    body[${SETTINGS_LOADING_FLAG}] main {
      visibility: hidden !important;
    }
    #${SETTINGS_LOADER_ID} {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: var(--bg-base);
    }
    #${SETTINGS_LOADER_ID} .skrepay-loader-logo {
      width: min(72vw, 320px);
      height: auto;
      animation: skrepay-logo-blink 1.6s ease-in-out infinite;
      user-select: none;
      pointer-events: none;
    }
  `
  document.head.appendChild(style)
}

function isSettingsLoaderVisible() {
  return document.body.hasAttribute(SETTINGS_LOADING_FLAG)
}

function createSettingsLoader() {
  const loader = document.createElement("div")
  loader.id = SETTINGS_LOADER_ID
  loader.setAttribute("role", "status")
  loader.setAttribute("aria-live", "polite")
  loader.setAttribute("aria-label", "Cargando configuración de Skrepay")
  loader.innerHTML = `
    <img
      class="skrepay-loader-logo"
      src="${SETTINGS_LOADER_LOGO_URL}"
      alt="Skrepay"
      width="320"
      height="320"
      decoding="async"
      draggable="false"
    />
  `
  return loader
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
    loader = createSettingsLoader()
    document.body.appendChild(loader)
  }

  syncLoaderTheme(loader)

  window.requestAnimationFrame(() => {
    const currentLoader = document.getElementById(SETTINGS_LOADER_ID)

    if (currentLoader) {
      syncLoaderTheme(currentLoader)
    }
  })
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
