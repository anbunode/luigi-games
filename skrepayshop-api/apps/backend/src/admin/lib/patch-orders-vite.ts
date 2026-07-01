import { patchOrderListBundle } from "./patch-orders"

type BundleChunk = {
  type?: string
  code?: string
  fileName?: string
}

function normalizeId(id: string) {
  return id.replace(/\\/g, "/")
}

export function patchOrdersVitePlugin() {
  return {
    name: "skrepay:orders-list-ui",
    enforce: "post" as const,
    config() {
      return {
        build: {
          rollupOptions: {
            output: {
              manualChunks(id) {
                const normalized = normalizeId(id)
                if (
                  normalized.includes("/admin/patches/skrepay-orders-list-entry") ||
                  normalized.includes("/admin/components/orders/")
                ) {
                  return "skrepay-orders-list"
                }
                return undefined
              },
            },
          },
        },
      }
    },
    generateBundle(
      _outputOptions: unknown,
      bundle: Record<string, BundleChunk>
    ) {
      patchOrderListBundle(bundle)
    },
  }
}
