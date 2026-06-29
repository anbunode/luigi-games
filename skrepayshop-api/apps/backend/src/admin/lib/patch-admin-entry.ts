const BOOTSTRAP_IMPORT = 'import "../../src/admin/lib/admin-bootstrap"'
const PLUGIN_IMPORT = 'import plugin0 from "@medusajs/draft-order/admin"'
const PLUGINS_WITH_DRAFT = "<App plugins={[plugin0]} />"
const PLUGINS_EMPTY = "<App />"

export function patchAdminEntrySource(content: string): string {
  let patched = content

  if (!patched.includes("admin-bootstrap")) {
    patched = `${BOOTSTRAP_IMPORT}\n${patched}`
  }

  patched = patched.split(PLUGIN_IMPORT).join("")
  patched = patched.replace(`${PLUGIN_IMPORT}\r\n`, "")
  patched = patched.replace(`${PLUGIN_IMPORT}\n`, "")

  patched = patched.split(PLUGINS_WITH_DRAFT).join(PLUGINS_EMPTY)
  patched = patched.split("plugins={[plugin0]}").join("plugins={[]}")

  return patched
}

function stripPlugin0FromChunk(code: string): string {
  return code
    .split("plugins:[plugin0]").join("plugins:[]")
    .split("plugins={[plugin0]}").join("plugins={[]}")
}

export function patchAdminEntryVitePlugin() {
  return {
    name: "skrepay:remove-draft-order-plugin",
    enforce: "pre" as const,
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
    renderChunk(code: string, chunk: { fileName?: string }) {
      if (!chunk.fileName?.startsWith("index-") || !code.includes("plugin0")) {
        return null
      }

      const patched = stripPlugin0FromChunk(code)

      if (patched === code) {
        return null
      }

      return {
        code: patched,
        map: null,
      }
    },
    generateBundle(
      _outputOptions: unknown,
      bundle: Record<string, { type?: string; code?: string; fileName?: string }>
    ) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== "chunk" || !chunk.code || !chunk.fileName?.includes("index-")) {
          continue
        }

        if (/\bplugin0\b/.test(chunk.code)) {
          throw new Error(
            `[skrepay:remove-draft-order-plugin] ${chunk.fileName} still references plugin0`
          )
        }
      }
    },
  }
}
