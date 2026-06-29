import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useLayoutEffect } from "react"
import { installAuthBridge } from "../lib/auth-bridge"
import {
  isStoreCurrencyManagementPage,
  SKREPAY_ROUTE_CHANGE_EVENT,
} from "../lib/region-routes"

const BODY_FLAG = "data-skrepay-hide-store-currencies"

const hideStoreCurrenciesStyles = `
  body[${BODY_FLAG}] a[href$="/currencies"],
  body[${BODY_FLAG}] a[href="currencies"] {
    display: none !important;
  }
`

const CURRENCY_SECTION_LABELS = new Set(["monedas", "currencies"])

function hideStoreCurrenciesSection() {
  document.querySelectorAll("h2").forEach((heading) => {
    const label = heading.textContent?.trim().toLowerCase()
    if (!label || !CURRENCY_SECTION_LABELS.has(label)) {
      return
    }

    const section =
      heading.closest("div.divide-y.p-0") ??
      heading.closest("div.bg-ui-bg-base") ??
      heading.closest("section")

    if (section instanceof HTMLElement) {
      section.style.display = "none"
    }
  })
}

function syncStoreCurrenciesUi() {
  if (!isStoreCurrencyManagementPage(window.location.pathname)) {
    document.body.removeAttribute(BODY_FLAG)
    return
  }

  document.body.setAttribute(BODY_FLAG, "true")

  if (/\/settings\/store\/currencies\/?$/.test(
    window.location.pathname.replace(/^\/app(?=\/|$)/, "") || "/"
  )) {
    window.history.replaceState({}, "", "/app/settings/store")
  }

  hideStoreCurrenciesSection()
}

/**
 * Oculta Tienda → Monedas: la tienda usa todas las monedas con impuestos apagados
 * (aplicado en el servidor al cargar /admin/stores).
 */
const HideStoreCurrenciesSection = () => {
  useLayoutEffect(() => {
    installAuthBridge()
    syncStoreCurrenciesUi()

    const observer = new MutationObserver(() => {
      syncStoreCurrenciesUi()
    })

    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener(SKREPAY_ROUTE_CHANGE_EVENT, syncStoreCurrenciesUi)
    window.addEventListener("popstate", syncStoreCurrenciesUi)

    return () => {
      observer.disconnect()
      window.removeEventListener(SKREPAY_ROUTE_CHANGE_EVENT, syncStoreCurrenciesUi)
      window.removeEventListener("popstate", syncStoreCurrenciesUi)
      document.body.removeAttribute(BODY_FLAG)
    }
  }, [])

  return <style>{hideStoreCurrenciesStyles}</style>
}

export const config = defineWidgetConfig({
  zone: ["store.details.before", "store.details.after"],
})

export default HideStoreCurrenciesSection
