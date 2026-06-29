const PLUGIN_IMPORT = 'import plugin0 from "@medusajs/draft-order/admin"'
const PLUGINS_WITH_DRAFT = "<App plugins={[plugin0]} />"
const PLUGINS_EMPTY = "<App />"

export function patchAdminEntrySource(content: string): string {
  let patched = content

  if (patched.includes(PLUGIN_IMPORT)) {
    patched = patched.replace(`${PLUGIN_IMPORT}\n`, "")
    patched = patched.replace(PLUGIN_IMPORT, "")
  }

  if (patched.includes(PLUGINS_WITH_DRAFT)) {
    patched = patched.replace(PLUGINS_WITH_DRAFT, PLUGINS_EMPTY)
  }

  return patched
}

export function patchAdminEntryVitePlugin() {
  return {
    name: "skrepay:remove-draft-order-plugin",
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
