import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useLayoutEffect } from "react"
import { SKREPAY_ROUTE_CHANGE_EVENT } from "../lib/region-routes"

const BODY_FLAG = "data-skrepay-hide-profile"

const PROFILE_PATH = /\/settings\/profile(?:\/|$)/

const hideProfileStyles = `
  body[${BODY_FLAG}] a[href*="settings/profile"],
  body[${BODY_FLAG}] a[href="/profile"],
  body[${BODY_FLAG}] a[href="profile"] {
    display: none !important;
  }
`

const ACCOUNT_GROUP_LABELS = new Set([
  "mi cuenta",
  "my account",
  "mon compte",
  "mein konto",
])

function normalizePath(pathname: string) {
  return pathname.replace(/^\/app(?=\/|$)/, "") || "/"
}

function redirectProfileRoute() {
  const path = normalizePath(window.location.pathname)

  if (PROFILE_PATH.test(path)) {
    window.history.replaceState({}, "", "/app/settings/store")
  }
}

function hideProfileNavItems() {
  document.querySelectorAll('a[href*="settings/profile"]').forEach((link) => {
    const row =
      link.closest("li") ??
      link.closest('[role="menuitem"]') ??
      link.parentElement

    if (row instanceof HTMLElement) {
      row.style.display = "none"
    }
  })

  document.querySelectorAll("span, p, div, button").forEach((element) => {
    const label = element.textContent?.trim().toLowerCase()

    if (!label || !ACCOUNT_GROUP_LABELS.has(label)) {
      return
    }

    const group =
      element.closest("li") ??
      element.closest("div.flex.flex-col") ??
      element.parentElement

    if (group instanceof HTMLElement) {
      group.style.display = "none"
    }
  })
}

function syncProfileVisibility() {
  document.body.setAttribute(BODY_FLAG, "true")
  redirectProfileRoute()
  hideProfileNavItems()
}

const HideProfileSettings = () => {
  useLayoutEffect(() => {
    syncProfileVisibility()

    const observer = new MutationObserver(() => {
      syncProfileVisibility()
    })

    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener(SKREPAY_ROUTE_CHANGE_EVENT, syncProfileVisibility)
    window.addEventListener("popstate", syncProfileVisibility)

    return () => {
      observer.disconnect()
      window.removeEventListener(SKREPAY_ROUTE_CHANGE_EVENT, syncProfileVisibility)
      window.removeEventListener("popstate", syncProfileVisibility)
      document.body.removeAttribute(BODY_FLAG)
    }
  }, [])

  return <style>{hideProfileStyles}</style>
}

export const config = defineWidgetConfig({
  zone: [
    "store.details.before",
    "order.list.before",
    "product.list.before",
    "region.list.before",
  ],
})

export default HideProfileSettings
