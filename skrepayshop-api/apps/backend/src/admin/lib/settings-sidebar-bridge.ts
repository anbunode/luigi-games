import {
  isSettingsPage,
  SKREPAY_ROUTE_CHANGE_EVENT,
} from "./region-routes"
import { getSettingsNavIconPath } from "./settings-sidebar-routes"
import {
  hideSettingsLoadingOverlayImmediately,
  scheduleHideSettingsLoadingOverlay,
  showSettingsLoadingOverlay,
  shouldShowSettingsLoadingOverlay,
} from "./settings-loading-overlay"

const BODY_FLAG = "data-skrepay-shopify-settings-nav"
const CHROME_ID = "skrepay-settings-sidebar-chrome"
const HIDDEN_PROFILE = "data-skrepay-profile-hidden"
const HIDDEN_BREADCRUMB = "data-skrepay-settings-breadcrumb-hidden"
const SETTINGS_TOPBAR_FLAG = "data-skrepay-settings-topbar"
const PROFILE_PATH = /\/settings\/profile(?:\/|$)/

let topbarStylesInstalled = false

declare global {
  interface Window {
    __skrepaySettingsSidebarBridgeInstalled?: boolean
    __skrepaySettingsSidebarSyncing?: boolean
  }
}

type StoreSummary = {
  name: string
  subtitle: string | null
}

let storeSummaryCache: StoreSummary | null = null
let storeSummaryPromise: Promise<StoreSummary> | null = null
let searchQuery = ""

function normalizePath(pathname: string) {
  return pathname.replace(/^\/app(?=\/|$)/, "") || "/"
}

function redirectProfileRoute() {
  const path = normalizePath(window.location.pathname)

  if (PROFILE_PATH.test(path)) {
    window.history.replaceState({}, "", "/app/settings/store")
  }
}

async function fetchStoreSummary(): Promise<StoreSummary> {
  if (storeSummaryCache) {
    return storeSummaryCache
  }

  if (!storeSummaryPromise) {
    storeSummaryPromise = fetch("/admin/stores", {
      credentials: "include",
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          return { name: "Tienda", subtitle: null }
        }

        const body = (await response.json()) as {
          stores?: Array<{
            name: string
            metadata?: Record<string, unknown> | null
          }>
        }

        const store = body.stores?.[0]

        if (!store) {
          return { name: "Tienda", subtitle: null }
        }

        return {
          name: store.name,
          subtitle:
            (store.metadata?.contact_email as string | undefined) ??
            (store.metadata?.business_name as string | undefined) ??
            null,
        }
      })
      .catch(() => ({ name: "Tienda", subtitle: null }))
  }

  storeSummaryCache = await storeSummaryPromise
  return storeSummaryCache
}

function findSettingsAside(): HTMLElement | null {
  for (const aside of document.querySelectorAll("aside")) {
    if (aside.querySelector('nav a[href*="/settings/"]')) {
      return aside
    }
  }

  return null
}

function clearPreviouslyHiddenSections() {
  document.querySelectorAll(`[${HIDDEN_PROFILE}="true"]`).forEach((element) => {
    if (!(element instanceof HTMLElement)) {
      return
    }

    element.style.removeProperty("display")
    element.removeAttribute(HIDDEN_PROFILE)
  })

  document.querySelectorAll(`[${HIDDEN_BREADCRUMB}="true"]`).forEach((element) => {
    if (!(element instanceof HTMLElement)) {
      return
    }

    element.style.removeProperty("display")
    element.removeAttribute(HIDDEN_BREADCRUMB)
  })

  document.querySelectorAll(`[${SETTINGS_TOPBAR_FLAG}="true"]`).forEach((element) => {
    element.removeAttribute(SETTINGS_TOPBAR_FLAG)
  })
}

function ensureTopbarStyles() {
  if (topbarStylesInstalled || typeof document === "undefined") {
    return
  }

  topbarStylesInstalled = true
  const style = document.createElement("style")
  style.setAttribute("data-skrepay-settings-topbar-styles", "true")
  style.textContent = `
    body[${BODY_FLAG}] [${SETTINGS_TOPBAR_FLAG}="true"] > [${HIDDEN_BREADCRUMB}="true"],
    body[${BODY_FLAG}] [${HIDDEN_BREADCRUMB}="true"] {
      display: none !important;
      width: 0 !important;
      min-width: 0 !important;
      max-width: 0 !important;
      opacity: 0 !important;
      overflow: hidden !important;
      padding: 0 !important;
      margin: 0 !important;
      border: 0 !important;
      pointer-events: none !important;
    }

    body[${BODY_FLAG}] [${SETTINGS_TOPBAR_FLAG}="true"] > :not(:first-child):not(:last-child) {
      display: none !important;
    }

    body[${BODY_FLAG}] div:has(> main) > div[class*="h-14"] > :nth-child(2),
    body[${BODY_FLAG}] aside ~ div > div[class*="h-14"] > :nth-child(2),
    body[${BODY_FLAG}] aside ~ div div[class*="h-14"][class*="items-center"] > :nth-child(2) {
      display: none !important;
    }

    body[${BODY_FLAG}] div:has(> main) > div[class*="h-14"] a[href*="/settings"],
    body[${BODY_FLAG}] div:has(> main) > div[class*="h-14"] a[href*="/app/settings"],
    body[${BODY_FLAG}] aside ~ div div[class*="h-14"] a[href*="/settings"],
    body[${BODY_FLAG}] aside ~ div div[class*="h-14"] a[href*="/app/settings"] {
      display: none !important;
    }
  `
  document.head.appendChild(style)
}

function isNotificationsHost(element: HTMLElement) {
  return (
    element.classList.contains("ms-auto") ||
    element.className.includes("ms-auto") ||
    Boolean(
      element.querySelector(
        '[aria-label*="notification" i], [data-testid*="notification"]'
      )
    )
  )
}

function findSettingsTopbar(): HTMLElement | null {
  const aside = findSettingsAside()

  if (!aside?.parentElement) {
    return null
  }

  const layoutRoot = aside.parentElement
  const main = layoutRoot.querySelector("main")

  if (main) {
    let sibling = main.previousElementSibling

    while (sibling) {
      if (sibling instanceof HTMLElement && sibling.querySelector("button")) {
        return sibling
      }

      sibling = sibling.previousElementSibling
    }

    const mainParent = main.parentElement

    if (mainParent) {
      for (const child of mainParent.children) {
        if (!(child instanceof HTMLElement)) {
          continue
        }

        if (child === main) {
          break
        }

        if (child.contains(aside)) {
          continue
        }

        if (child.querySelector("button")) {
          return child
        }
      }
    }
  }

  for (const element of layoutRoot.querySelectorAll("div, header")) {
    if (!(element instanceof HTMLElement)) {
      continue
    }

    if (element === aside || aside.contains(element)) {
      continue
    }

    if (!element.querySelector("button")) {
      continue
    }

    const className = element.className

    if (!className.includes("h-14") && !className.includes("items-center")) {
      continue
    }

    const text = element.textContent?.toLowerCase() ?? ""

    if (
      text.includes("configuraciones") ||
      text.includes("settings") ||
      element.querySelector('a[href*="/settings"], a[href*="/app/settings"]')
    ) {
      return element
    }
  }

  return null
}

function applyTopbarBreadcrumbHide(topbar: HTMLElement) {
  topbar.setAttribute(SETTINGS_TOPBAR_FLAG, "true")

  const children = Array.from(topbar.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement
  )

  for (const child of children) {
    if (child === children[0] && child.querySelector("button")) {
      continue
    }

    if (isNotificationsHost(child)) {
      continue
    }

    child.setAttribute(HIDDEN_BREADCRUMB, "true")
  }

  topbar
    .querySelectorAll('a[href*="/settings"], a[href*="/app/settings"]')
    .forEach((link) => {
      if (!(link instanceof HTMLElement)) {
        return
      }

      const host =
        link.parentElement instanceof HTMLElement &&
        link.parentElement.parentElement === topbar
          ? link.parentElement
          : link

      host.setAttribute(HIDDEN_BREADCRUMB, "true")
    })

  topbar.querySelectorAll("span, p").forEach((node) => {
    if (!(node instanceof HTMLElement)) {
      return
    }

    if (node.closest("button")) {
      return
    }

    const text = node.textContent?.trim().toLowerCase() ?? ""

    if (!text || text === "...") {
      node.setAttribute(HIDDEN_BREADCRUMB, "true")
      return
    }

    if (
      text.includes("configuraciones") ||
      text.includes("settings") ||
      /tienda|users|regiones|regions|store|tax|locations|workflows|api/i.test(
        text
      )
    ) {
      const hideTarget =
        node.parentElement &&
        node.parentElement !== topbar.firstElementChild &&
        node.parentElement.parentElement === topbar
          ? node.parentElement
          : node

      hideTarget.setAttribute(HIDDEN_BREADCRUMB, "true")
    }
  })
}

function hideSettingsTopbarBreadcrumb() {
  ensureTopbarStyles()

  const topbar = findSettingsTopbar()

  if (topbar) {
    applyTopbarBreadcrumbHide(topbar)
    return
  }

  const aside = findSettingsAside()

  aside?.parentElement
    ?.querySelectorAll("div, header")
    .forEach((element) => {
      if (!(element instanceof HTMLElement)) {
        return
      }

      if (aside.contains(element)) {
        return
      }

      if (!element.className.includes("h-14")) {
        return
      }

      if (!element.querySelector("button")) {
        return
      }

      applyTopbarBreadcrumbHide(element)
    })
}

function hideProfileSection() {
  clearPreviouslyHiddenSections()

  document
    .querySelectorAll('aside a[href*="settings/profile"]')
    .forEach((link) => {
      if (!(link instanceof HTMLAnchorElement)) {
        return
      }

      const nav = link.closest("nav")
      const section =
        nav?.parentElement?.parentElement?.parentElement ?? null

      if (!(section instanceof HTMLElement)) {
        return
      }

      section.setAttribute(HIDDEN_PROFILE, "true")
      section.style.display = "none"

      const divider = section.previousElementSibling

      if (
        divider instanceof HTMLElement &&
        divider.classList.contains("px-3")
      ) {
        divider.setAttribute(HIDDEN_PROFILE, "true")
        divider.style.display = "none"
      }
    })
}

function normalizeSettingsHref(href: string) {
  let path = href

  try {
    path = new URL(href, window.location.origin).pathname
  } catch {
    // keep raw href
  }

  if (path.startsWith("/app")) {
    path = path.slice(4) || "/"
  }

  return path.split("?")[0] ?? path
}

function decorateNavLinks(aside: HTMLElement) {
  aside.querySelectorAll("nav a").forEach((anchor) => {
    if (!(anchor instanceof HTMLAnchorElement)) {
      return
    }

    const href = anchor.getAttribute("href") ?? ""

    if (!href.includes("/settings/") || href.includes("/settings/profile")) {
      return
    }

    anchor.setAttribute("data-skrepay-settings-nav-link", "true")

    if (anchor.querySelector("[data-skrepay-settings-nav-icon]")) {
      return
    }

    const path = normalizeSettingsHref(href)
    const iconPath = getSettingsNavIconPath(path)
    const icon = document.createElement("span")
    icon.setAttribute("data-skrepay-settings-nav-icon", "true")
    icon.className =
      "text-ui-fg-muted inline-flex size-[18px] shrink-0 items-center justify-center [&>svg]:size-[18px]"
    icon.innerHTML = iconPath

    const label = anchor.querySelector("span, p")

    if (label instanceof HTMLElement) {
      anchor.insertBefore(icon, label)
      return
    }

    anchor.insertBefore(icon, anchor.firstChild)
  })
}

function applyNavSearchFilter(aside: HTMLElement) {
  const query = searchQuery.trim().toLowerCase()

  aside.querySelectorAll("[data-skrepay-settings-nav-link]").forEach((link) => {
    if (!(link instanceof HTMLElement)) {
      return
    }

    const row = link.closest(".px-3") ?? link.parentElement
    const label = link.textContent?.trim().toLowerCase() ?? ""
    const visible = !query || label.includes(query)

    if (row instanceof HTMLElement) {
      row.style.display = visible ? "" : "none"
    }
  })
}

function removeChrome() {
  document.getElementById(CHROME_ID)?.remove()
}

async function ensureChrome(aside: HTMLElement) {
  let chrome = document.getElementById(CHROME_ID)

  if (!chrome) {
    chrome = document.createElement("div")
    chrome.id = CHROME_ID
    chrome.className =
      "border-ui-border-base bg-ui-bg-subtle border-b px-3 pb-3 pt-2"

    const scrollContainer =
      aside.querySelector(".flex.flex-1.flex-col.overflow-y-auto") ??
      aside.querySelector(".flex.flex-1.flex-col") ??
      aside

    scrollContainer.insertBefore(chrome, scrollContainer.firstChild)
  }

  const summary = await fetchStoreSummary()

  chrome.innerHTML = `
    <div class="mb-3 flex items-center gap-x-3 rounded-xl px-1 py-1">
      <div class="bg-ui-bg-base border-ui-border-base flex size-10 shrink-0 items-center justify-center rounded-xl border shadow-borders-base">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" fill="currentColor" class="text-ui-fg-subtle size-5">
          <path d="M6.5 1A1.5 1.5 0 0 0 5 2.5V3H1.5A1.5 1.5 0 0 0 0 4.5v8A1.5 1.5 0 0 0 1.5 14h12a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 13.5 3H10v-.5A1.5 1.5 0 0 0 8.5 1zM6 2.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5V3H6z"/>
        </svg>
      </div>
      <div class="min-w-0">
        <p class="txt-compact-small-plus text-ui-fg-base truncate">${escapeHtml(summary.name)}</p>
        ${
          summary.subtitle
            ? `<p class="txt-compact-xsmall text-ui-fg-muted truncate">${escapeHtml(summary.subtitle)}</p>`
            : ""
        }
      </div>
    </div>
    <div class="relative">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" fill="currentColor" class="text-ui-fg-muted pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M10.5 6a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0m-.82 4.74a6 6 0 1 1 1.06-1.06l3.04 3.04a.75.75 0 1 1-1.06 1.06z"/>
      </svg>
      <input
        type="search"
        placeholder="Buscar"
        class="bg-ui-bg-base border-ui-border-base txt-compact-small text-ui-fg-base placeholder:text-ui-fg-muted h-8 w-full rounded-lg border pl-8 pr-3 outline-none focus:shadow-borders-focus"
        value="${escapeHtml(searchQuery)}"
      />
    </div>
  `

  const input = chrome.querySelector("input")

  if (input instanceof HTMLInputElement) {
    input.oninput = () => {
      searchQuery = input.value
      applyNavSearchFilter(aside)
    }
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

export function syncSettingsSidebarBridge() {
  if (typeof window === "undefined") {
    return
  }

  if (!isSettingsPage(window.location.pathname)) {
    document.body.removeAttribute(BODY_FLAG)
    hideSettingsLoadingOverlayImmediately()
    removeChrome()
    clearPreviouslyHiddenSections()
    return
  }

  if (shouldShowSettingsLoadingOverlay()) {
    showSettingsLoadingOverlay()
  }

  redirectProfileRoute()
  document.body.setAttribute(BODY_FLAG, "true")

  const aside = findSettingsAside()

  if (!aside) {
    scheduleHideSettingsLoadingOverlay()
    return
  }

  hideProfileSection()
  hideSettingsTopbarBreadcrumb()
  void ensureChrome(aside).then(() => {
    decorateNavLinks(aside)
    applyNavSearchFilter(aside)
    hideSettingsTopbarBreadcrumb()
    scheduleHideSettingsLoadingOverlay()
  })

  window.requestAnimationFrame(() => {
    hideSettingsTopbarBreadcrumb()
  })
}

export function installSettingsSidebarBridge() {
  if (typeof window === "undefined") {
    return
  }

  syncSettingsSidebarBridge()

  if (window.__skrepaySettingsSidebarBridgeInstalled) {
    return
  }

  window.__skrepaySettingsSidebarBridgeInstalled = true

  const scheduleSync = () => {
    if (window.__skrepaySettingsSidebarSyncing) {
      return
    }

    window.__skrepaySettingsSidebarSyncing = true
    window.requestAnimationFrame(() => {
      syncSettingsSidebarBridge()
      window.__skrepaySettingsSidebarSyncing = false
    })
  }

  const observer = new MutationObserver((mutations) => {
    const relevant = mutations.some((mutation) => {
      const target = mutation.target

      if (!(target instanceof HTMLElement)) {
        return true
      }

      return (
        !target.closest(`#${CHROME_ID}`) &&
        !target.hasAttribute("data-skrepay-settings-nav-icon")
      )
    })

    if (relevant) {
      scheduleSync()
    }
  })

  observer.observe(document.body, { childList: true, subtree: true })
  window.addEventListener(SKREPAY_ROUTE_CHANGE_EVENT, scheduleSync)
  window.addEventListener("popstate", scheduleSync)
}
