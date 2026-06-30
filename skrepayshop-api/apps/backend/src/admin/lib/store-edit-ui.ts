const STORE_EDIT_BODY_FLAG = "data-skrepay-store-edit"
const STORE_EDIT_DRAWER_FLAG = "data-skrepay-store-edit-drawer"
const STORE_EDIT_OVERLAY_FLAG = "data-skrepay-store-edit-overlay"
const LOCAL_TAX_FIELD_FLAG = "data-skrepay-local-currency-tax"
const LOCAL_TAX_SWITCH_ID = "skrepay-local-currency-tax-switch"

const DEFAULT_CURRENCY_LABELS = [
  "moneda por defecto",
  "default currency",
]

const STORE_EDIT_STYLES = `
  body[${STORE_EDIT_BODY_FLAG}] [${STORE_EDIT_DRAWER_FLAG}] {
    position: fixed !important;
    left: 50% !important;
    top: 50% !important;
    right: auto !important;
    bottom: auto !important;
    inset: auto !important;
    transform: translate(-50%, -50%) !important;
    width: min(32rem, calc(100vw - 2rem)) !important;
    max-width: min(32rem, calc(100vw - 2rem)) !important;
    min-width: min(32rem, calc(100vw - 2rem)) !important;
    max-height: min(44rem, calc(100vh - 2rem)) !important;
    height: auto !important;
    min-height: 24rem !important;
    margin: 0 !important;
    animation: none !important;
    transition: none !important;
  }

  body[${STORE_EDIT_BODY_FLAG}] [${STORE_EDIT_OVERLAY_FLAG}] {
    background-color: rgba(0, 0, 0, 0.45) !important;
    opacity: 1 !important;
    pointer-events: auto !important;
  }
`

let cachedTaxEnabled: boolean | null = null

function ensureStoreEditStyles() {
  const id = "skrepay-store-edit-styles"
  if (document.getElementById(id)) {
    return
  }

  const style = document.createElement("style")
  style.id = id
  style.textContent = STORE_EDIT_STYLES
  document.head.appendChild(style)
}

function matchesDefaultCurrencyLabel(text: string): boolean {
  const normalized = text.trim().toLowerCase()
  return DEFAULT_CURRENCY_LABELS.some((label) => normalized.includes(label))
}

function isStoreEditDrawer(node: HTMLElement): boolean {
  const text = node.textContent?.toLowerCase() ?? ""

  return (
    text.includes("moneda por defecto") ||
    text.includes("default currency") ||
    (text.includes("nombre") &&
      (text.includes("región por defecto") ||
        text.includes("default region") ||
        text.includes("canal de ventas") ||
        text.includes("sales channel")))
  )
}

function findStoreEditDrawer(root: ParentNode = document): HTMLElement | null {
  const taxField = root.querySelector(`[${LOCAL_TAX_FIELD_FLAG}]`)
  if (taxField instanceof HTMLElement) {
    const drawer =
      taxField.closest(".shadow-elevation-modal") ??
      taxField.closest(".fixed.flex-col.overflow-hidden.rounded-lg")

    if (drawer instanceof HTMLElement) {
      return drawer
    }
  }

  for (const candidate of root.querySelectorAll(".shadow-elevation-modal")) {
    if (!(candidate instanceof HTMLElement)) {
      continue
    }

    if (isStoreEditDrawer(candidate)) {
      return candidate
    }
  }

  return null
}

function findStoreEditOverlay(drawer: HTMLElement): HTMLElement | null {
  const parent = drawer.parentElement
  if (!parent) {
    return null
  }

  for (const child of parent.children) {
    if (!(child instanceof HTMLElement) || child === drawer) {
      continue
    }

    if (
      child.classList.contains("fixed") &&
      (child.classList.contains("inset-0") ||
        child.classList.contains("bg-ui-bg-overlay"))
    ) {
      return child
    }
  }

  return parent.querySelector(".bg-ui-bg-overlay.fixed.inset-0")
}

export function centerStoreEditDrawer(root: ParentNode = document) {
  ensureStoreEditStyles()

  root
    .querySelectorAll(`[${STORE_EDIT_DRAWER_FLAG}]`)
    .forEach((node) => node.removeAttribute(STORE_EDIT_DRAWER_FLAG))

  root
    .querySelectorAll(`[${STORE_EDIT_OVERLAY_FLAG}]`)
    .forEach((node) => node.removeAttribute(STORE_EDIT_OVERLAY_FLAG))

  const drawer = findStoreEditDrawer(root)
  if (!drawer) {
    document.body.removeAttribute(STORE_EDIT_BODY_FLAG)
    return
  }

  drawer.setAttribute(STORE_EDIT_DRAWER_FLAG, "true")

  const overlay = findStoreEditOverlay(drawer)
  if (overlay) {
    overlay.setAttribute(STORE_EDIT_OVERLAY_FLAG, "true")
  }

  document.body.setAttribute(STORE_EDIT_BODY_FLAG, "true")
}

function setSwitchState(button: HTMLButtonElement, checked: boolean) {
  button.setAttribute("aria-checked", checked ? "true" : "false")
  button.setAttribute("data-state", checked ? "checked" : "unchecked")
  button.classList.toggle("bg-ui-bg-interactive", checked)
  button.classList.toggle("bg-ui-bg-switch-off", !checked)
}

function createLocalTaxSwitch(checked: boolean): HTMLElement {
  const field = document.createElement("div")
  field.setAttribute(LOCAL_TAX_FIELD_FLAG, "true")
  field.className = "flex flex-col gap-y-2"

  const row = document.createElement("div")
  row.className = "flex items-start justify-between gap-x-4"

  const label = document.createElement("label")
  label.className =
    "txt-compact-medium font-sans font-medium text-pretty leading-snug"
  label.setAttribute("for", LOCAL_TAX_SWITCH_ID)
  label.textContent = "Activar impuestos para tu moneda local"

  const button = document.createElement("button")
  button.id = LOCAL_TAX_SWITCH_ID
  button.type = "button"
  button.role = "switch"
  button.className =
    "bg-ui-bg-switch-off focus-visible:shadow-borders-focus transition-fg relative inline-flex h-[18px] w-[32px] shrink-0 cursor-pointer rounded-full outline-none disabled:cursor-not-allowed disabled:opacity-50"

  const thumb = document.createElement("span")
  thumb.className =
    "bg-ui-fg-on-color shadow-details-contrast-on-bg-interactive transition-fg pointer-events-none block size-[14px] rounded-full"
  thumb.setAttribute("data-state", checked ? "checked" : "unchecked")
  button.appendChild(thumb)

  setSwitchState(button, checked)
  thumb.style.transform = checked ? "translateX(14px)" : "translateX(2px)"

  button.addEventListener("click", () => {
    const next = button.getAttribute("data-state") !== "checked"
    setSwitchState(button, next)
    thumb.setAttribute("data-state", next ? "checked" : "unchecked")
    thumb.style.transform = next ? "translateX(14px)" : "translateX(2px)"
    cachedTaxEnabled = next
  })

  row.append(label, button)
  field.appendChild(row)
  return field
}

function findDefaultCurrencyField(root: ParentNode = document): HTMLElement | null {
  for (const label of root.querySelectorAll("label")) {
    if (!(label instanceof HTMLElement)) {
      continue
    }

    if (!matchesDefaultCurrencyLabel(label.textContent ?? "")) {
      continue
    }

    const field =
      label.closest("div.flex.flex-col.gap-y-2") ??
      label.closest("div.flex.flex-col")

    if (field instanceof HTMLElement) {
      return field
    }
  }

  return null
}

async function loadLocalCurrencyTaxEnabled(): Promise<boolean> {
  if (cachedTaxEnabled !== null) {
    return cachedTaxEnabled
  }

  try {
    const response = await fetch(
      `/admin/skrepay/store-local-currency-tax?_ts=${Date.now()}`,
      {
        credentials: "include",
        cache: "no-store",
      }
    )

    if (!response.ok) {
      return false
    }

    const body = await response.json()
    cachedTaxEnabled = body.enabled === true
    return cachedTaxEnabled
  } catch {
    return false
  }
}

export function readLocalCurrencyTaxCheckbox(): boolean {
  const button = document.getElementById(LOCAL_TAX_SWITCH_ID)
  if (button instanceof HTMLButtonElement) {
    return button.getAttribute("data-state") === "checked"
  }

  return cachedTaxEnabled === true
}

export function resetLocalCurrencyTaxCache() {
  cachedTaxEnabled = null
}

export async function applyStoreEditUi(root: ParentNode = document) {
  centerStoreEditDrawer(root)

  const defaultCurrencyField = findDefaultCurrencyField(root)
  if (!defaultCurrencyField) {
    return
  }

  const existing = root.querySelector(`[${LOCAL_TAX_FIELD_FLAG}]`)
  if (!existing) {
    const enabled = await loadLocalCurrencyTaxEnabled()
    const taxField = createLocalTaxSwitch(enabled)
    defaultCurrencyField.insertAdjacentElement("afterend", taxField)
  }

  centerStoreEditDrawer(root)
}

export function clearStoreEditUi() {
  document.body.removeAttribute(STORE_EDIT_BODY_FLAG)

  document
    .querySelectorAll(`[${STORE_EDIT_DRAWER_FLAG}]`)
    .forEach((node) => node.removeAttribute(STORE_EDIT_DRAWER_FLAG))

  document
    .querySelectorAll(`[${STORE_EDIT_OVERLAY_FLAG}]`)
    .forEach((node) => node.removeAttribute(STORE_EDIT_OVERLAY_FLAG))

  resetLocalCurrencyTaxCache()

  document
    .querySelectorAll(`[${LOCAL_TAX_FIELD_FLAG}]`)
    .forEach((node) => node.remove())
}
