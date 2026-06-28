/** Rutas nativas de Medusa que reemplazamos u ocultamos del menú. */
const LEGACY_REGION_PATHS = ["/settings/tax-regions", "/regions"]
let installed = false

function shouldHideHref(href: string): boolean {
  const normalized = href.toLowerCase()
  return LEGACY_REGION_PATHS.some((segment) => normalized.includes(segment))
}

function hideLegacyRegionNavItems() {
  const anchors = document.querySelectorAll("a[href]")

  anchors.forEach((anchor) => {
    const href = anchor.getAttribute("href") ?? ""
    if (!shouldHideHref(href)) {
      return
    }

    const row =
      anchor.closest("li") ??
      anchor.closest('[role="menuitem"]')?.parentElement ??
      anchor.parentElement

    if (row instanceof HTMLElement) {
      row.style.display = "none"
      row.setAttribute("data-skrepay-hidden-region-nav", "true")
    }
  })
}

export function installHideLegacyRegionsNav() {
  if (installed || typeof document === "undefined") {
    return
  }

  installed = true
  hideLegacyRegionNavItems()

  const observer = new MutationObserver(() => {
    hideLegacyRegionNavItems()
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })
}
