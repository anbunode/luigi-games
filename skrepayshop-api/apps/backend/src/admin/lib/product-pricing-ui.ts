/** Columnas de moneda ISO: "Precio EUR" / "Price USD" (no regiones como "Precio Europa"). */
const ISO_CURRENCY_PRICE_HEADER = /\b(?:Precio|Price)\s+([A-Z]{3})\b/i

const HIDDEN_ATTR = "data-skrepay-hidden-currency"

function hideGridColumn(grid: Element, columnIndex: string) {
  const selector = `[data-column-index="${columnIndex}"]`

  grid.querySelectorAll(selector).forEach((node) => {
    if (!(node instanceof HTMLElement)) {
      return
    }

    node.setAttribute(HIDDEN_ATTR, "true")
    node.style.setProperty("display", "none", "important")
    node.style.setProperty("width", "0", "important")
    node.style.setProperty("min-width", "0", "important")
    node.style.setProperty("padding", "0", "important")
    node.style.setProperty("border", "none", "important")
    node.setAttribute("aria-hidden", "true")
  })
}

/**
 * Oculta columnas currency_prices.* del DataGrid de Medusa (role=grid, no <table>).
 * Mantiene la moneda base y todas las columnas por región.
 */
export function hideNonDefaultStoreCurrencyPriceColumns(
  defaultCurrencyCode: string,
  root: ParentNode = document
) {
  const defaultCode = defaultCurrencyCode.toUpperCase()

  root.querySelectorAll('[role="grid"]').forEach((grid) => {
    grid.querySelectorAll('[role="columnheader"]').forEach((header) => {
      if (!(header instanceof HTMLElement)) {
        return
      }

      const label = header.textContent?.replace(/\s+/g, " ").trim() ?? ""
      const match = label.match(ISO_CURRENCY_PRICE_HEADER)

      if (!match) {
        return
      }

      const code = match[1].toUpperCase()

      if (code === defaultCode) {
        header.removeAttribute(HIDDEN_ATTR)
        header.style.removeProperty("display")
        header.style.removeProperty("width")
        header.style.removeProperty("min-width")
        header.style.removeProperty("padding")
        header.style.removeProperty("border")
        header.removeAttribute("aria-hidden")
        return
      }

      const columnIndex = header.getAttribute("data-column-index")

      if (columnIndex === null) {
        return
      }

      hideGridColumn(grid, columnIndex)
    })
  })
}
