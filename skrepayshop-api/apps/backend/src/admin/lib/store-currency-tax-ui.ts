const TAX_COLUMN_LABELS = [
  "precios con impuestos incluidos",
  "tax inclusive pricing",
  "tax-inclusive pricing",
]

const TAX_MENU_LABELS = [
  "habilitar precios con impuestos",
  "deshabilitar precios con impuestos",
  "enable tax inclusive",
  "disable tax inclusive",
]

function matchesLabel(text: string, labels: string[]): boolean {
  const normalized = text.trim().toLowerCase()
  return labels.some((label) => normalized.includes(label))
}

export function hideStoreCurrencyTaxInclusiveUi(root: ParentNode = document) {
  root.querySelectorAll("table").forEach((table) => {
    const headers = Array.from(table.querySelectorAll("thead th"))
    const index = headers.findIndex((th) =>
      matchesLabel(th.textContent ?? "", TAX_COLUMN_LABELS)
    )

    if (index < 0) {
      return
    }

    headers[index]?.style.setProperty("display", "none", "important")
    table.querySelectorAll("tbody tr").forEach((row) => {
      row.querySelectorAll("td")[index]?.style.setProperty("display", "none", "important")
    })
  })

  root.querySelectorAll("[role='menuitem'], button, a").forEach((node) => {
    if (!(node instanceof HTMLElement)) {
      return
    }

    if (!matchesLabel(node.textContent ?? "", TAX_MENU_LABELS)) {
      return
    }

    node.style.display = "none"
  })
}
