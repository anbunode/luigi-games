import { patchRegionCreateCurrencyChunk } from "./patch-region-create-currency"

type BundleChunk = {
  type?: string
  code?: string
  fileName?: string
}

export function patchRegionCreateCurrencyVitePlugin() {
  return {
    name: "skrepay:region-create-currency-codes",
    enforce: "post" as const,
    renderChunk(code: string, chunk: { fileName?: string }) {
      const patched = patchRegionCreateCurrencyChunk(code, chunk.fileName)

      if (!patched) {
        return null
      }

      return {
        code: patched,
        map: null,
      }
    },
    generateBundle(
      _outputOptions: unknown,
      bundle: Record<string, BundleChunk>
    ) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== "chunk" || !chunk.code) {
          continue
        }

        const patched = patchRegionCreateCurrencyChunk(chunk.code, chunk.fileName)

        if (patched && patched !== chunk.code) {
          chunk.code = patched
        }
      }
    },
  }
}
