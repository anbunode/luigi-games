/**
 * Reemplaza el chunk nativo order-list por un redirect a la UI Skrepay.
 * Se ejecuta después de `medusa build` (el hook de Vite no siempre persiste).
 */
import { readFileSync, readdirSync, writeFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const assetsDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../.medusa/server/public/admin/assets"
)

const MARKER = "data-skrepay-orders-shell"
const ENTRY_MARKER = "skrepay-orders-list-entry"

function findSkrepayOrdersChunk(files) {
  for (const file of files) {
    if (!file.startsWith("skrepay-orders-list-") || !file.endsWith(".js")) {
      continue
    }
    const code = readFileSync(resolve(assetsDir, file), "utf8")
    if (code.includes(MARKER) || code.includes(ENTRY_MARKER)) {
      return { file, code }
    }
  }
  return null
}

function resolveListExport(code) {
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

  return null
}

const files = readdirSync(assetsDir)
const skrepay = findSkrepayOrdersChunk(files)

if (!skrepay) {
  console.error("FAIL: no skrepay-orders-list chunk with shell marker")
  process.exit(1)
}

const exportName = resolveListExport(skrepay.code)
if (!exportName) {
  console.error("FAIL: could not resolve OrdersListPage export in", skrepay.file)
  process.exit(1)
}

const orderListFile = files.find(
  (file) => file.startsWith("order-list-") && file.endsWith(".js")
)

if (!orderListFile) {
  console.error("FAIL: no order-list chunk found")
  process.exit(1)
}

const orderListPath = resolve(assetsDir, orderListFile)
const patchedCode = `import{${exportName} as e}from"./${skrepay.file}";export{e as Component};`

writeFileSync(orderListPath, patchedCode, "utf8")

console.log("PATCHED:", orderListFile, "->", skrepay.file, `(export ${exportName})`)
