import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useLayoutEffect } from "react"

const CURRENCY_HEADINGS = new Set(["currencies", "monedas", "locales", "idiomas"])

const hideStoreSectionsStyles = `
  body[data-skrepay-store-settings] .flex.flex-col.gap-y-3 > div.divide-y.p-0:has(> div h2) {
    display: none !important;
  }

  body[data-skrepay-store-settings] .flex.flex-col.gap-y-3 > div:has(a[href="metadata/edit"]),
  body[data-skrepay-store-settings] .flex.flex-col.gap-y-3 > div:has(a[href$="/metadata/edit"]) {
    display: none !important;
  }

  body[data-skrepay-store-settings] .flex.flex-col.gap-y-3 > div.flex.items-center.justify-between.px-6.py-4:has(h2) {
    display: none !important;
  }
`

function isStoreSettingsPage() {
  return /\/settings\/store\/?$/.test(window.location.pathname)
}

function hideCurrencySections() {
  if (!isStoreSettingsPage()) {
    return
  }

  document.querySelectorAll("h2").forEach((heading) => {
    const label = heading.textContent?.trim().toLowerCase()
    if (!label || !CURRENCY_HEADINGS.has(label)) {
      return
    }

    const section = heading.closest("div.divide-y.p-0")
    if (section instanceof HTMLElement) {
      section.style.display = "none"
    }
  })
}

function syncStoreSettingsScope() {
  if (isStoreSettingsPage()) {
    document.body.setAttribute("data-skrepay-store-settings", "true")
    hideCurrencySections()
    return
  }

  document.body.removeAttribute("data-skrepay-store-settings")
}

const HideStoreSections = () => {
  useLayoutEffect(() => {
    syncStoreSettingsScope()

    const observer = new MutationObserver(() => {
      syncStoreSettingsScope()
    })

    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener("popstate", syncStoreSettingsScope)

    return () => {
      observer.disconnect()
      window.removeEventListener("popstate", syncStoreSettingsScope)
      document.body.removeAttribute("data-skrepay-store-settings")
    }
  }, [])

  return <style>{hideStoreSectionsStyles}</style>
}

export const config = defineWidgetConfig({
  zone: ["store.details.before", "store.details.after"],
})

export default HideStoreSections
