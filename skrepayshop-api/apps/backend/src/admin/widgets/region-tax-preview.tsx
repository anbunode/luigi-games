import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"
import {
  formatTaxPercent,
  priceWithTax,
  taxAmountFromBase,
} from "../lib/tax-pricing"

type RegionTaxCountry = {
  iso_2: string
  display_name: string | null
  tax_percent: number | null
  tax_rate_name: string | null
}

type RegionTaxSummary = {
  region_id: string
  region_name: string
  currency_code: string
  automatic_taxes: boolean
  countries: RegionTaxCountry[]
}

function isProductPricingPage() {
  const path = window.location.pathname
  return (
    /\/products\/create\b/.test(path) ||
    /\/products\/[^/]+\/prices\b/.test(path) ||
    (/\/products\/[^/]+$/.test(path) && !/\/products$/.test(path))
  )
}

function readBasePriceHint(): number | null {
  const inputs = Array.from(
    document.querySelectorAll<HTMLInputElement>("input[type='number'], input[inputmode='decimal']")
  )

  for (const input of inputs) {
    const value = Number.parseFloat(input.value.replace(",", "."))
    if (Number.isFinite(value) && value > 0) {
      return value
    }
  }

  return null
}

const RegionTaxPreview = () => {
  const [summaries, setSummaries] = useState<RegionTaxSummary[]>([])
  const [basePrice, setBasePrice] = useState<number | null>(null)
  const [visible, setVisible] = useState(isProductPricingPage())

  useEffect(() => {
    const syncVisibility = () => setVisible(isProductPricingPage())
    syncVisibility()
    window.addEventListener("popstate", syncVisibility)
    window.addEventListener("skrepay:route-change", syncVisibility)
    return () => {
      window.removeEventListener("popstate", syncVisibility)
      window.removeEventListener("skrepay:route-change", syncVisibility)
    }
  }, [])

  useEffect(() => {
    if (!visible) {
      return
    }

    let cancelled = false

    fetch("/admin/skrepay/region-taxes", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (!cancelled && body?.region_taxes) {
          setSummaries(body.region_taxes)
        }
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [visible])

  useEffect(() => {
    if (!visible) {
      return
    }

    const syncPrice = () => setBasePrice(readBasePriceHint())
    syncPrice()

    const observer = new MutationObserver(syncPrice)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["value"],
    })

    document.addEventListener("input", syncPrice, true)
    document.addEventListener("change", syncPrice, true)

    return () => {
      observer.disconnect()
      document.removeEventListener("input", syncPrice, true)
      document.removeEventListener("change", syncPrice, true)
    }
  }, [visible])

  const rows = useMemo(() => {
    const output: Array<{
      region: string
      country: string
      rate: number
      tax: number
      total: number
      currency: string
    }> = []

    if (basePrice === null) {
      return output
    }

    for (const region of summaries) {
      for (const country of region.countries) {
        if (country.tax_percent === null) {
          continue
        }

        output.push({
          region: region.region_name,
          country: country.display_name ?? country.iso_2.toUpperCase(),
          rate: country.tax_percent,
          tax: taxAmountFromBase(basePrice, country.tax_percent),
          total: priceWithTax(basePrice, country.tax_percent),
          currency: region.currency_code.toUpperCase(),
        })
      }
    }

    return output
  }, [summaries, basePrice])

  if (!visible || !summaries.length) {
    return null
  }

  return (
    <Container className="mb-4 divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Impuestos por región</Heading>
        <Badge size="small" color="grey">
          Precio base + IVA
        </Badge>
      </div>

      <div className="flex flex-col gap-3 px-6 py-4">
        <Text size="small" className="text-ui-fg-subtle">
          {basePrice === null
            ? "Introduce un precio en la tabla de variantes para ver el desglose automático según los países de cada región."
            : `Precio base detectado: ${basePrice.toFixed(2)}`}
        </Text>

        {rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-ui-fg-subtle">
                  <th className="py-2 pr-3 font-medium">Región</th>
                  <th className="py-2 pr-3 font-medium">País</th>
                  <th className="py-2 pr-3 font-medium">IVA</th>
                  <th className="py-2 pr-3 font-medium">Impuesto</th>
                  <th className="py-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.region}-${row.country}`} className="border-b last:border-0">
                    <td className="py-2 pr-3">{row.region}</td>
                    <td className="py-2 pr-3">{row.country}</td>
                    <td className="py-2 pr-3">{formatTaxPercent(row.rate)}%</td>
                    <td className="py-2 pr-3">
                      +{row.tax.toFixed(2)} {row.currency}
                    </td>
                    <td className="py-2 font-medium">
                      {row.total.toFixed(2)} {row.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Text size="small" className="text-ui-fg-subtle">
            Las regiones activas aún no tienen países con tasa impositiva configurada.
            Edita una región, añade países y guarda para generar los impuestos automáticamente.
          </Text>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: [
    "product.details.before",
    "product.details.after",
    "product.list.before",
  ],
})

export default RegionTaxPreview
