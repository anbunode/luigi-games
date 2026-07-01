import {
  patchDraftOrderAdminSource,
  patchDraftOrderBundleChunk,
} from "./patch-draft-order"

type BundleChunk = {
  type?: string
  code?: string
  fileName?: string
}

export function patchDraftOrderVitePlugin() {
  return {
    name: "skrepay:draft-order-no-render-throw",
    enforce: "post" as const,
    transform(code: string, id: string) {
      const normalized = id.replace(/\\/g, "/")

      if (!normalized.includes("@medusajs/draft-order")) {
        return null
      }

      if (!normalized.includes("/admin/index.mjs")) {
        return null
      }

      const patched = patchDraftOrderAdminSource(code)

      if (!patched) {
        return null
      }

      return {
        code: patched,
        map: null,
      }
    },
    renderChunk(code: string, chunk: { fileName?: string }) {
      const patched = patchDraftOrderBundleChunk(code, chunk.fileName)

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

        const patched = patchDraftOrderBundleChunk(chunk.code, chunk.fileName)

        if (patched && patched !== chunk.code) {
          chunk.code = patched
        }
      }
    },
  }
}
