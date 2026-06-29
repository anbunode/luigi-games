const PLUGIN_IMPORT = 'import plugin0 from "@medusajs/draft-order/admin"'
const PATCHED_IMPORT =
  'import plugin0 from "../../src/admin/plugins/skrepay-draft-order"'

export function patchAdminEntrySource(content: string): string {
  if (content.includes(PATCHED_IMPORT)) {
    return content
  }

  if (!content.includes(PLUGIN_IMPORT)) {
    return content
  }

  return content.replace(PLUGIN_IMPORT, PATCHED_IMPORT)
}

export function patchAdminEntryVitePlugin() {
  return {
    name: "skrepay:patch-draft-order-entry",
    enforce: "post" as const,
    transform(code: string, id: string) {
      if (!id.replace(/\\/g, "/").endsWith("/.medusa/client/entry.jsx")) {
        return null
      }

      const patched = patchAdminEntrySource(code)

      if (patched === code) {
        return null
      }

      return {
        code: patched,
        map: null,
      }
    },
  }
}
