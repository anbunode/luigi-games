/**
 * Tasas impositivas estándar por país (IVA/VAT %).
 * Fuente única para sincronizar tax_rate y mostrar vista previa en el panel.
 */
export const COUNTRY_DEFAULT_TAX_RATES: Record<string, number> = {
  es: 21,
  ve: 16,
  de: 19,
  fr: 20,
  it: 22,
  pt: 23,
  nl: 21,
  be: 21,
  at: 20,
  ie: 23,
  pl: 23,
  se: 25,
  dk: 25,
  fi: 24,
  gr: 24,
  cz: 21,
  ro: 19,
  hu: 27,
  gb: 20,
  us: 0,
  mx: 16,
  co: 19,
  ar: 21,
  cl: 19,
  pe: 18,
  br: 17,
  ec: 15,
  uy: 22,
  pa: 7,
  cr: 13,
}

export function getDefaultTaxRateForCountry(iso2: string): number | null {
  const code = iso2.trim().toLowerCase()
  if (!code) {
    return null
  }

  if (Object.prototype.hasOwnProperty.call(COUNTRY_DEFAULT_TAX_RATES, code)) {
    return COUNTRY_DEFAULT_TAX_RATES[code]
  }

  return null
}

export function formatTaxPercent(rate: number): string {
  const rounded = Math.round(rate * 100) / 100
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2)
}

export function priceWithTax(basePrice: number, taxPercent: number): number {
  if (!Number.isFinite(basePrice) || basePrice < 0) {
    return 0
  }

  return Math.round(basePrice * (1 + taxPercent / 100) * 100) / 100
}

export function taxAmountFromBase(basePrice: number, taxPercent: number): number {
  if (!Number.isFinite(basePrice) || basePrice < 0) {
    return 0
  }

  return Math.round(basePrice * (taxPercent / 100) * 100) / 100
}
