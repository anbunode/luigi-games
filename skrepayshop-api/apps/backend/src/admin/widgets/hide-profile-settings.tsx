import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useLayoutEffect } from "react"
import { SKREPAY_ROUTE_CHANGE_EVENT } from "../lib/region-routes"

const BODY_FLAG = "data-skrepay-hide-profile"
const HIDDEN_MARKER = "data-skrepay-profile-hidden"

const PROFILE_PATH = /\/settings\/profile(?:\/|$)/

const hideProfileStyles = `
  body[${BODY_FLAG}] aside a[href*="settings/profile"] {
    display: none !important;
  }
`

function normalizePath(pathname: string) {
  return pathname.replace(/^\/app(?=\/|$)/, "") || "/"
}

function redirectProfileRoute() {
  const path = normalizePath(window.location.pathname)

  if (PROFILE_PATH.test(path)) {
    window.history.replaceState({}, "", "/app/settings/store")
  }
}

function clearPreviouslyHiddenSections() {
  document.querySelectorAll(`[${HIDDEN_MARKER}="true"]`).forEach((element) => {
    if (!(element instanceof HTMLElement)) {
      return
    }

    element.style.removeProperty("display")
    element.removeAttribute(HIDDEN_MARKER)
  })
}

function hideMyAccountSidebarSection() {
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

      section.setAttribute(HIDDEN_MARKER, "true")
      section.style.display = "none"

      const divider = section.previousElementSibling

      if (
        divider instanceof HTMLElement &&
        divider.classList.contains("px-3")
      ) {
        divider.setAttribute(HIDDEN_MARKER, "true")
        divider.style.display = "none"
      }
    })
}

function syncProfileVisibility() {
  document.body.setAttribute(BODY_FLAG, "true")
  redirectProfileRoute()
  hideMyAccountSidebarSection()
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
      clearPreviouslyHiddenSections()
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
