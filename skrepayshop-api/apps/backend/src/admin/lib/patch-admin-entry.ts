const BOOTSTRAP_IMPORT = 'import "../../src/admin/lib/admin-bootstrap"'

export function patchAdminEntrySource(content: string): string {
  if (content.includes("admin-bootstrap")) {
    return content
  }

  return `${BOOTSTRAP_IMPORT}\n${content}`
}

export function patchAdminEntryVitePlugin() {
  return {
    name: "skrepay:inject-admin-bootstrap",
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
  }
}
