import type { RegionFormCurrencyRow } from "./region-form-currency-overlay"

const REGION_TAX_INCLUSIVE_LABELS = [
  "precios con impuestos incluidos",
  "prices with taxes included",
  "tax-inclusive prices",
  "tax inclusive pricing",
]

const CURRENCY_FIELD_LABELS = ["moneda", "currency"]

function matchesLabel(text: string, labels: string[]): boolean {
  const normalized = text.trim().toLowerCase()
  return labels.some((label) => normalized.includes(label))
}

export function formatRegionFormCurrencyOptions(
  currencies: RegionFormCurrencyRow[]
): RegionFormCurrencyRow[] {
  return currencies.map((row) => {
    const code = (row.currency?.code ?? row.currency_code).toUpperCase()

    return {
      ...row,
      currency: row.currency
        ? {
            ...row.currency,
            code: row.currency.code ?? row.currency_code,
            name: code,
          }
        : {
            code: row.currency_code,
            name: code,
            symbol: code,
            symbol_native: code,
            decimal_digits: 2,
          },
    }
  })
}

function hideTaxInclusiveFieldContainer(container: HTMLElement) {
  container.style.setProperty("display", "none", "important")
}

function hideTaxInclusiveBySwitchIndex(root: ParentNode) {
  root.querySelectorAll(".flex.flex-col.gap-y-4").forEach((group) => {
    const switches = group.querySelectorAll('[role="switch"]')
    if (switches.length < 2) {
      return
    }

    const taxSwitch = switches[1]
    const field = Array.from(group.children).find((child) =>
      child.contains(taxSwitch)
    )

    if (field instanceof HTMLElement) {
      hideTaxInclusiveFieldContainer(field)
    }
  })
}

export function hideRegionTaxInclusivePricingUi(root: ParentNode = document) {
  hideTaxInclusiveBySwitchIndex(root)

  root.querySelectorAll("label, p, span, h3, legend").forEach((node) => {
    if (!(node instanceof HTMLElement)) {
      return
    }

    const text = node.textContent?.trim().toLowerCase() ?? ""
    if (!matchesLabel(text, REGION_TAX_INCLUSIVE_LABELS)) {
      return
    }

    const field =
      node.closest("div.flex.flex-col.gap-y-2") ??
      node.closest("div.flex.flex-col") ??
      node.closest("fieldset") ??
      node.parentElement?.parentElement

    if (field instanceof HTMLElement) {
      hideTaxInclusiveFieldContainer(field)
    }
  })
}

function patchCurrencyComboboxValue(root: ParentNode, combo: HTMLElement) {
  const listboxId = combo.getAttribute("aria-controls")
  if (!listboxId) {
    return
  }

  const listbox = root.querySelector(`#${CSS.escape(listboxId)}`)
  const selectedOption =
    listbox?.querySelector('[role="option"][aria-selected="true"]') ??
    listbox?.querySelector('[role="option"][data-state="checked"]')

  const code = selectedOption?.getAttribute("data-value")
  if (!code || !/^[a-z]{3}$/i.test(code)) {
    return
  }

  const display = code.toUpperCase()
  const valueNode = combo.querySelector("span") ?? combo

  if (valueNode.textContent?.trim().toUpperCase() !== display) {
    valueNode.textContent = display
  }
}

export function patchRegionFormCurrencySelectLabels(root: ParentNode = document) {
  root.querySelectorAll('[role="option"]').forEach((node) => {
    if (!(node instanceof HTMLElement)) {
      return
    }

    const code = node.getAttribute("data-value")
    if (!code || !/^[a-z]{3}$/i.test(code)) {
      return
    }

    const display = code.toUpperCase()
    if (node.textContent?.trim().toUpperCase() !== display) {
      node.textContent = display
    }
  })

  root.querySelectorAll("label").forEach((label) => {
    if (!(label instanceof HTMLElement)) {
      return
    }

    const text = label.textContent?.trim().toLowerCase() ?? ""
    if (!CURRENCY_FIELD_LABELS.some((entry) => text === entry)) {
      return
    }

    const field =
      label.closest("div.flex.flex-col.gap-y-2") ??
      label.closest("div.flex.flex-col")

    const combo = field?.querySelector('[role="combobox"]')
    if (combo instanceof HTMLElement) {
      patchCurrencyComboboxValue(root, combo)
    }
  })
}
