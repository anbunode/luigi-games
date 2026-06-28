import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { formatTaxPercent } from "../lib/tax-pricing"

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

function isRegionDetailsPage() {
  return /\/settings\/regions\/[^/]+$/.test(window.location.pathname)
}

function readRegionIdFromPath(): string | null {
  const match = window.location.pathname.match(/\/settings\/regions\/([^/]+)$/)
  return match?.[1] ?? null
}

const RegionTaxDetails = () => {
  const [summary, setSummary] = useState<RegionTaxSummary | null>(null)
  const [visible, setVisible] = useState(isRegionDetailsPage())

  useEffect(() => {
    const sync = () => setVisible(isRegionDetailsPage())
    sync()
    window.addEventListener("popstate", sync)
    window.addEventListener("skrepay:route-change", sync)
    return () => {
      window.removeEventListener("popstate", sync)
      window.removeEventListener("skrepay:route-change", sync)
    }
  }, [])

  useEffect(() => {
    if (!visible) {
      return
    }

    const regionId = readRegionIdFromPath()
    if (!regionId) {
      return
    }

    let cancelled = false

    fetch("/admin/skrepay/region-taxes", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (cancelled || !body?.region_taxes) {
          return
        }

        const match = body.region_taxes.find(
          (entry: RegionTaxSummary) => entry.region_id === regionId
        )
        setSummary(match ?? null)
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [visible])

  if (!visible || !summary) {
    return null
  }

  return (
    <Container className="mb-4 divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Impuestos automáticos</Heading>
        <Badge size="small" color={summary.automatic_taxes ? "green" : "grey"}>
          {summary.automatic_taxes ? "Activos" : "Pendientes"}
        </Badge>
      </div>

      <div className="flex flex-col gap-3 px-6 py-4">
        <Text size="small" className="text-ui-fg-subtle">
          Al guardar la región con países, se crean tasas IVA/VAT según el catálogo
          configurado. Los precios base del producto se calculan con estos porcentajes.
        </Text>

        {summary.countries.length ? (
          <div className="flex flex-col gap-2">
            {summary.countries.map((country) => (
              <div
                key={country.iso_2}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <Text size="small" weight="plus">
                  {country.display_name ?? country.iso_2.toUpperCase()}
                </Text>
                <Text size="small" className="text-ui-fg-subtle">
                  {country.tax_percent !== null
                    ? `${country.tax_rate_name ?? "IVA"} · ${formatTaxPercent(country.tax_percent)}%`
                    : "Sin tasa configurada"}
                </Text>
              </div>
            ))}
          </div>
        ) : (
          <Text size="small" className="text-ui-fg-subtle">
            Añade países a la región y guarda para generar los impuestos automáticamente.
          </Text>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: ["region.details.after", "region.details.before"],
})

export default RegionTaxDetails
