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
