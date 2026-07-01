const BOOTSTRAP_IMPORT = 'import "../../src/admin/lib/admin-bootstrap"'
const ORDERS_ENTRY_IMPORT = 'import "../../src/admin/patches/skrepay-orders-list-entry"'

export function patchAdminEntrySource(content: string): string {
  let patched = content

  if (!content.includes("admin-bootstrap")) {
    patched = `${BOOTSTRAP_IMPORT}\n${content}`
  }

  if (!patched.includes("skrepay-orders-list-entry")) {
    patched = patched.replace(
      /import "\.\.\/\.\.\/src\/admin\/lib\/admin-bootstrap"\n/,
      `${BOOTSTRAP_IMPORT}\n${ORDERS_ENTRY_IMPORT}\n`
    )
  }

  return patched
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
