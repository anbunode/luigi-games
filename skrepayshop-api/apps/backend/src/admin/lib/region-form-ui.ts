import type { RegionFormCurrencyRow } from "./region-form-currency-overlay"

const REGION_TAX_INCLUSIVE_LABELS = [
  "precios con impuestos incluidos",
  "prices with taxes included",
  "tax-inclusive prices",
]

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

export function hideRegionTaxInclusivePricingUi(root: ParentNode = document) {
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
      field.style.setProperty("display", "none", "important")
    }
  })
}
