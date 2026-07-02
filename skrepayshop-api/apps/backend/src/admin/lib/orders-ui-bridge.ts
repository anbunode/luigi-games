import {
  ORDERS_DETAIL_FLAG,
  ORDERS_LIST_FLAG,
  isOrderDetailPage,
  isOrdersListPage,
} from "./orders-routes"
import { SKREPAY_ROUTE_CHANGE_EVENT } from "./region-routes"
import { scheduleHideOrdersLoadingOverlay } from "./orders-loading-overlay"
import { enableSkrepayTheme } from "./skrepay-theme"

const NATIVE_HIDDEN = "data-skrepay-native-hidden"
const STYLES_ID = "skrepay-orders-native-styles"

declare global {
  interface Window {
    __skrepayOrdersUiBridgeInstalled?: boolean
  }
}

const nativeRestyleCss = `
  body[${ORDERS_LIST_FLAG}] [data-skrepay-orders-native-host] {
    margin-top: 0.25rem;
  }
  body[${ORDERS_LIST_FLAG}] [data-skrepay-orders-native-host] table {
    width: 100%;
    border-collapse: collapse;
  }
  body[${ORDERS_LIST_FLAG}] [data-skrepay-orders-native-host] thead th {
    color: rgba(255,255,255,0.52) !important;
    font-weight: 500 !important;
    border-bottom: 1px solid rgba(255,255,255,0.08) !important;
  }
  body[${ORDERS_LIST_FLAG}] [data-skrepay-orders-native-host] tbody tr {
    border-bottom: 1px solid rgba(255,255,255,0.08) !important;
  }
  body[${ORDERS_LIST_FLAG}] [data-skrepay-orders-native-host] tbody tr:hover {
    background: rgba(123, 174, 138, 0.14) !important;
  }
  body[${ORDERS_DETAIL_FLAG}] [data-skrepay-orders-native-host] {
    margin-top: 0.5rem;
  }
  body[${ORDERS_DETAIL_FLAG}] [data-skrepay-orders-native-host] .shadow-elevation-card-rest,
  body[${ORDERS_DETAIL_FLAG}] [data-skrepay-orders-native-host] [class*="rounded-xl"] {
    border-radius: 6px !important;
    border-color: rgba(255,255,255,0.08) !important;
    background: rgba(255,255,255,0.03) !important;
  }
  [${NATIVE_HIDDEN}="true"] {
    display: none !important;
  }
`

function ensureNativeStyles() {
  if (document.getElementById(STYLES_ID)) {
    return
  }

  const style = document.createElement("style")
  style.id = STYLES_ID
  style.textContent = nativeRestyleCss
  document.head.appendChild(style)
}

function markHidden(element: HTMLElement) {
  element.setAttribute(NATIVE_HIDDEN, "true")
}

function findNativeListHost(shell: HTMLElement): HTMLElement | null {
  const divide = shell.closest(".divide-y")
  if (!divide) {
    return null
  }

  for (const child of Array.from(divide.children)) {
    if (child instanceof HTMLElement && !child.contains(shell)) {
      return child
    }
  }

  return null
}

function hideNativeListChrome(host: HTMLElement) {
  for (const heading of host.querySelectorAll("h1,h2")) {
    if (heading instanceof HTMLElement) {
      markHidden(heading)
    }
  }

  const toolbarCandidates = host.querySelectorAll(
    ":scope > div, :scope > section"
  )

  for (const node of toolbarCandidates) {
    if (!(node instanceof HTMLElement)) {
      continue
    }

    if (node.querySelector("table")) {
      continue
    }

    if (node.querySelector('input[type="search"], input[placeholder*="Search"], input[placeholder*="Buscar"]')) {
      markHidden(node)
      continue
    }

    if (
      node.querySelector("button, select, [role='combobox']") &&
      !node.querySelector("[data-skrepay-orders-shell]")
    ) {
      markHidden(node)
    }
  }
}

function findNativeDetailHosts(shell: HTMLElement): HTMLElement[] {
  const hosts: HTMLElement[] = []
  const divide = shell.closest(".divide-y")

  if (divide) {
    for (const child of Array.from(divide.children)) {
      if (child instanceof HTMLElement && !child.contains(shell)) {
        hosts.push(child)
      }
    }
  }

  if (!hosts.length) {
    let node: HTMLElement | null = shell.closest("[data-skrepay-orders-shell]")
    while (node) {
      const next = node.nextElementSibling
      if (next instanceof HTMLElement) {
        hosts.push(next)
        break
      }
      node = node.parentElement
    }
  }

  return hosts
}

function hideNativeDetailChrome(host: HTMLElement) {
  for (const heading of host.querySelectorAll("h1,h2")) {
    if (heading instanceof HTMLElement) {
      markHidden(heading)
    }
  }

  for (const node of host.querySelectorAll(
    ":scope > div.flex, :scope > div[class*='justify-between']"
  )) {
    if (!(node instanceof HTMLElement)) {
      continue
    }

    if (node.querySelector("[data-skrepay-order-detail-shell]")) {
      continue
    }

    if (node.querySelector("button, a[href*='/orders/']")) {
      markHidden(node)
    }
  }
}

function hideNativePageHeading() {
  const main = document.querySelector("main")
  if (!main) {
    return
  }

  const shell = main.querySelector(
    "[data-skrepay-orders-shell], [data-skrepay-order-detail-shell]"
  )
  if (!shell) {
    return
  }

  const topBars = main.querySelectorAll(
    ".flex.items-center.justify-between, nav[aria-label], [class*='breadcrumb']"
  )

  for (const bar of topBars) {
    if (bar instanceof HTMLElement && !bar.contains(shell)) {
      markHidden(bar)
    }
  }
}

function wrapNativeHost(host: HTMLElement) {
  if (host.hasAttribute("data-skrepay-orders-native-host")) {
    return
  }

  host.setAttribute("data-skrepay-orders-native-host", "true")
}

function ordersOverlayReady(): boolean {
  const listShell = document.querySelector("[data-skrepay-orders-shell]")
  const detailShell = document.querySelector("[data-skrepay-order-detail-shell]")
  const nativeHost = document.querySelector("[data-skrepay-orders-native-host]")

  if (isOrdersListPage(window.location.pathname)) {
    return Boolean(listShell && nativeHost)
  }

  if (isOrderDetailPage(window.location.pathname)) {
    return Boolean(detailShell && nativeHost)
  }

  return false
}

function syncOrdersListPage() {
  const path = window.location.pathname

  if (isOrdersListPage(path)) {
    document.body.setAttribute(ORDERS_LIST_FLAG, "true")
    document.body.removeAttribute(ORDERS_DETAIL_FLAG)
    enableSkrepayTheme()

    const shell = document.querySelector<HTMLElement>("[data-skrepay-orders-shell]")
    if (shell) {
      const host = findNativeListHost(shell)
      if (host) {
        wrapNativeHost(host)
        hideNativeListChrome(host)
      }
      hideNativePageHeading()
      if (ordersOverlayReady()) {
        scheduleHideOrdersLoadingOverlay()
      }
    }

    return
  }

  document.body.removeAttribute(ORDERS_LIST_FLAG)

  if (isOrderDetailPage(path)) {
    document.body.setAttribute(ORDERS_DETAIL_FLAG, "true")
    enableSkrepayTheme()

    const shell = document.querySelector<HTMLElement>(
      "[data-skrepay-order-detail-shell]"
    )
    if (shell) {
      for (const host of findNativeDetailHosts(shell)) {
        wrapNativeHost(host)
        hideNativeDetailChrome(host)
      }
      hideNativePageHeading()
      if (ordersOverlayReady()) {
        scheduleHideOrdersLoadingOverlay()
      }
    }

    return
  }

  document.body.removeAttribute(ORDERS_DETAIL_FLAG)
}

export function syncOrdersListFilters(query: string) {
  const host = document.querySelector("[data-skrepay-orders-native-host]")
  const input = host?.querySelector(
    'input[type="search"], input[placeholder*="Search"], input[placeholder*="Buscar"]'
  )

  if (!(input instanceof HTMLInputElement)) {
    return
  }

  if (input.value === query) {
    return
  }

  input.value = query
  input.dispatchEvent(new Event("input", { bubbles: true }))
  input.dispatchEvent(new Event("change", { bubbles: true }))
}

function syncNativeSelectFilter(value: string, matchers: string[]) {
  if (value === "all") {
    return
  }

  const host = document.querySelector("[data-skrepay-orders-native-host]")
  const selects = host?.querySelectorAll("select")
  if (!selects?.length) {
    return
  }

  for (const select of selects) {
    if (!(select instanceof HTMLSelectElement)) {
      continue
    }

    const option = Array.from(select.options).find((entry) =>
      matchers.some((matcher) =>
        entry.value.toLowerCase().includes(matcher.toLowerCase())
      )
    )

    if (option) {
      select.value = option.value
      select.dispatchEvent(new Event("change", { bubbles: true }))
      break
    }
  }
}

export function syncOrdersPaymentFilter(value: string) {
  syncNativeSelectFilter(value, [value, "payment", "pago"])
}

export function syncOrdersFulfillmentFilter(value: string) {
  syncNativeSelectFilter(value, [value, "fulfillment", "cumpl"])
}

export function clickNativeOrderAction(label: RegExp): boolean {
  const roots: ParentNode[] = [
    ...document.querySelectorAll("[data-skrepay-orders-native-host]"),
    document.querySelector("main") ?? document,
  ]

  for (const root of roots) {
    const candidates = root.querySelectorAll("button, a, [role='button']")

    for (const node of candidates) {
      if (!(node instanceof HTMLElement)) {
        continue
      }

      if (node.closest("[data-skrepay-orders-shell], [data-skrepay-order-detail-shell]")) {
        continue
      }

      const text = (node.textContent ?? "").trim()
      if (!label.test(text)) {
        continue
      }

      node.click()
      return true
    }
  }

  return false
}

let observer: MutationObserver | null = null
let scheduled = false

function scheduleSync() {
  if (scheduled) {
    return
  }

  scheduled = true
  requestAnimationFrame(() => {
    scheduled = false
    syncOrdersListPage()
  })
}

export function installOrdersUiBridge() {
  if (typeof window === "undefined" || window.__skrepayOrdersUiBridgeInstalled) {
    return
  }

  window.__skrepayOrdersUiBridgeInstalled = true
  ensureNativeStyles()
  syncOrdersListPage()

  window.addEventListener(SKREPAY_ROUTE_CHANGE_EVENT, scheduleSync)
  window.addEventListener("popstate", scheduleSync)

  observer = new MutationObserver(scheduleSync)
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "data-state"],
  })
}
