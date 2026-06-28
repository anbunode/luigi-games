/** Rutas nativas de Medusa que ocultamos del menú (no incluye nuestra sección Skrepay). */
const HIDE_PATH_SUFFIXES = ["/settings/tax-regions"]

let installed = false

function normalizePath(href: string): string {
  const raw = href.split("?")[0]?.split("#")[0] ?? href
  try {
    const url = raw.startsWith("http")
      ? new URL(raw)
      : new URL(raw, "http://localhost")
    return url.pathname.replace(/\/+$/, "").toLowerCase()
  } catch {
    return raw.replace(/\/+$/, "").toLowerCase()
  }
}

function isSkrepayRegionsPath(path: string): boolean {
  return path.includes("/settings/regions")
}

function shouldHideHref(href: string): boolean {
  const path = normalizePath(href)

  // Nunca ocultar nuestra sección en Configuraciones
  if (isSkrepayRegionsPath(path)) {
    return false
  }

  if (HIDE_PATH_SUFFIXES.some((suffix) => path.includes(suffix))) {
    return true
  }

  // Ocultar /regions suelta del panel nativo (Extensiones), no bajo settings
  if (path.endsWith("/regions")) {
    return true
  }

  return false
}

function restoreSkrepayRegionsNav() {
  document
    .querySelectorAll('[data-skrepay-hidden-region-nav="true"]')
    .forEach((row) => {
      const anchor = row.querySelector("a[href]")
      const href = anchor?.getAttribute("href") ?? ""
      if (isSkrepayRegionsPath(normalizePath(href))) {
        if (row instanceof HTMLElement) {
          row.style.display = ""
          row.removeAttribute("data-skrepay-hidden-region-nav")
        }
      }
    })
}

function hideLegacyRegionNavItems() {
  restoreSkrepayRegionsNav()

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
