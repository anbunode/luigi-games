import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useLayoutEffect } from "react"

const HIDDEN_HEADINGS = new Set(["locales", "idiomas", "metadata", "metadatos"])

const hideStoreSectionsStyles = `
  body[data-skrepay-store-settings] .flex.flex-col.gap-y-3 > div:has(a[href="metadata/edit"]),
  body[data-skrepay-store-settings] .flex.flex-col.gap-y-3 > div:has(a[href$="/metadata/edit"]) {
    display: none !important;
  }
`

function isStoreSettingsPage() {
  return /\/settings\/store\/?$/.test(window.location.pathname)
}

function hideStoreSections() {
  if (!isStoreSettingsPage()) {
    return
  }

  document.querySelectorAll("h2").forEach((heading) => {
    const label = heading.textContent?.trim().toLowerCase()
    if (!label || !HIDDEN_HEADINGS.has(label)) {
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
    hideStoreSections()
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
