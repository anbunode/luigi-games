export const SKREPAY_ORDERS_LIST_ENTRY = "skrepay-orders-list-entry"
export const SKREPAY_ORDERS_SHELL = "data-skrepay-orders-shell"

type BundleChunk = {
  type?: string
  code?: string
  fileName?: string
}

export function resolveOrdersListExport(code: string): string {
  const componentExport = code.match(/export\{[^}]*\b(\w+) as Component\b[^}]*\}/)
  if (componentExport?.[1]) {
    return componentExport[1]
  }

  if (code.includes("function Component(")) {
    return "Component"
  }

  const ordersPageExport = code.match(/export\{[^}]*\b(\w+) as O\b[^}]*\}/)
  if (ordersPageExport?.[1]) {
    return ordersPageExport[1]
  }

  const defaultFn = code.match(/function (fc)\(\)/)
  if (defaultFn?.[1]) {
    return defaultFn[1]
  }

  return "Component"
}

export function patchOrderListBundle(
  bundle: Record<string, BundleChunk>,
  resolveExport: (code: string) => string = resolveOrdersListExport
): boolean {
  let entryChunkFile: string | null = null
  let entryCode = ""

  for (const chunk of Object.values(bundle)) {
    if (chunk.type !== "chunk" || !chunk.code) {
      continue
    }

    if (
      chunk.fileName?.includes("skrepay-orders-list") ||
      chunk.code.includes(SKREPAY_ORDERS_LIST_ENTRY) ||
      chunk.code.includes(SKREPAY_ORDERS_SHELL)
    ) {
      entryChunkFile = chunk.fileName ?? null
      entryCode = chunk.code
      if (entryChunkFile) {
        break
      }
    }
  }

  if (!entryChunkFile) {
    return false
  }

  const exportName = resolveExport(entryCode)
  let patched = false

  for (const chunk of Object.values(bundle)) {
    if (!chunk.fileName?.startsWith("order-list-") || !chunk.code) {
      continue
    }

    if (chunk.code.includes(SKREPAY_ORDERS_SHELL)) {
      patched = true
      break
    }

    chunk.code = `import{${exportName} as e}from"./${entryChunkFile}";export{e as Component};`
    patched = true
    break
  }

  return patched
}
