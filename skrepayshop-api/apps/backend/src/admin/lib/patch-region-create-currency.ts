/**
 * Medusa region create maps store.supported_currencies through a static catalog
 * and renders Select.Item children as currency names ("Euro"). Tienda → Monedas
 * lists the same store currencies by code. Patch the create chunk to prefer store
 * currency rows and always display codes.
 */
export function patchRegionCreateCurrencyChunk(
  code: string,
  fileName?: string
): string | null {
  const isRegionCreateChunk =
    fileName?.includes("region-create") ||
    code.includes("regions.createRegion")

  if (!isRegionCreateChunk) {
    return null
  }

  if (!code.includes("supported_currencies") || !code.includes("currency_code")) {
    return null
  }

  let patched = code
  let changed = false

  const staticCatalogPattern =
    /\.map\((\w)=>ue\[(\1)\.currency_code\.toUpperCase\(\)\]\)/g

  if (staticCatalogPattern.test(patched)) {
    patched = patched.replace(
      staticCatalogPattern,
      `.flatMap($1=>{const code=($1.currency_code||"").toUpperCase();if(!code)return[];const fromStore=$1.currency;const fromCatalog=ue[code];if(fromStore)return[{code,name:code,symbol:fromStore.symbol??code,symbol_native:fromStore.symbol_native??code,decimal_digits:fromStore.decimal_digits??2}];if(fromCatalog)return[{...fromCatalog,code,name:code}];return[]})`
    )
    changed = true
  }

  if (patched.includes("children:c.name")) {
    patched = patched.replace(
      /children:c\.name/g,
      'children:(c.code||"").toUpperCase()'
    )
    changed = true
  }

  if (!changed) {
    return null
  }

  return patched
}
