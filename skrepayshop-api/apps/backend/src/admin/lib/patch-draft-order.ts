/**
 * Disable native @medusajs/draft-order admin routes. The plugin UI crashes during
 * render in our multi-tenant setup; Skrepay ships its own /draft-orders pages.
 */
export function patchDraftOrderAdminSource(code: string): string | null {
  if (!code.includes('path: "/draft-orders"')) {
    return null
  }

  let patched = code
  let changed = false

  const routeModuleRegex = /const routeModule = \{\s*routes: \[[\s\S]*?\n  \]\s*\};/
  if (routeModuleRegex.test(patched)) {
    patched = patched.replace(routeModuleRegex, "const routeModule = { routes: [] };")
    changed = true
  }

  const menuRegex = /const menuItemModule = \{\s*menuItems: \[[\s\S]*?\]\s*\};/
  if (menuRegex.test(patched)) {
    patched = patched.replace(menuRegex, "const menuItemModule = { menuItems: [] };")
    changed = true
  }

  return changed ? patched : null
}

export function patchDraftOrderBundleChunk(
  code: string,
  fileName?: string
): string | null {
  if (!fileName?.startsWith("index-") || !code.includes('path:"/draft-orders"')) {
    return null
  }

  return patchDraftOrderAdminSource(code)
}
