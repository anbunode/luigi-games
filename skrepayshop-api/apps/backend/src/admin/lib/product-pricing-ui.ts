/** Moneda ISO en columna de tienda: "Precio EUR" / "Price USD" (no regiones como "Precio Europa"). */
const CURRENCY_PRICE_HEADER = /\b(?:Precio|Price)\s+([A-Z]{3})\b/i

/**
 * Oculta columnas "Precio XXX" de monedas de tienda excepto la moneda base.
 * Las columnas "Precio {Región}" siguen visibles.
 */
export function hideNonDefaultStoreCurrencyPriceColumns(
  defaultCurrencyCode: string,
  root: ParentNode = document
) {
  const defaultCode = defaultCurrencyCode.toUpperCase()

  root.querySelectorAll("table").forEach((table) => {
    const headers = Array.from(table.querySelectorAll("thead th"))

    headers.forEach((th, index) => {
      const label = th.textContent?.replace(/\s+/g, " ").trim() ?? ""
      const match = label.match(CURRENCY_PRICE_HEADER)

      if (!match) {
        return
      }

      const code = match[1].toUpperCase()

      if (code === defaultCode) {
        return
      }

      th.style.setProperty("display", "none", "important")
      table.querySelectorAll("tbody tr").forEach((row) => {
        row.querySelectorAll("td")[index]?.style.setProperty(
          "display",
          "none",
          "important"
        )
      })
    })
  })
}
