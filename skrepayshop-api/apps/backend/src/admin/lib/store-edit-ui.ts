const LOCAL_TAX_FIELD_FLAG = "data-skrepay-local-currency-tax"
const LOCAL_TAX_SWITCH_ID = "skrepay-local-currency-tax-switch"

const DEFAULT_CURRENCY_LABELS = [
  "moneda por defecto",
  "default currency",
]

let cachedTaxEnabled: boolean | null = null

function matchesDefaultCurrencyLabel(text: string): boolean {
  const normalized = text.trim().toLowerCase()
  return DEFAULT_CURRENCY_LABELS.some((label) => normalized.includes(label))
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
  const defaultCurrencyField = findDefaultCurrencyField(root)
  if (!defaultCurrencyField) {
    return
  }

  const existing = root.querySelector(`[${LOCAL_TAX_FIELD_FLAG}]`)
  if (existing) {
    return
  }

  const enabled = await loadLocalCurrencyTaxEnabled()
  const taxField = createLocalTaxSwitch(enabled)
  defaultCurrencyField.insertAdjacentElement("afterend", taxField)
}

export function clearStoreEditUi() {
  resetLocalCurrencyTaxCache()

  document
    .querySelectorAll(`[${LOCAL_TAX_FIELD_FLAG}]`)
    .forEach((node) => node.remove())
}
