/**
 * Verifica que el admin use la UI Skrepay de borradores (no el plugin nativo roto).
 */
import { readFileSync, readdirSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const assetsDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../apps/backend/.medusa/server/public/admin/assets"
)

const forbidden = [
  "Usa un borrador",
  "borrador@pendiente.local",
  'path:"/borradores"',
  "order-create-draft-cta",
  "DraftOrderComposer",
]

const required = [
  "data-skrepay-draft-orders-shell",
  'path:"/draft-orders"',
]

let mainBundle = ""

try {
  const files = readdirSync(assetsDir)
  mainBundle =
    files.find((f) => /^index-.+\.js$/.test(f) && f !== "index-CX2q6FwY.js") ?? ""
} catch {
  console.error("No admin assets — run medusa build first")
  process.exit(1)
}

if (!mainBundle) {
  console.error("Main index bundle not found in", assetsDir)
  process.exit(1)
}

const content = readFileSync(resolve(assetsDir, mainBundle), "utf8")
let failed = false

for (const needle of forbidden) {
  if (content.includes(needle)) {
    console.error(`FAIL: forbidden marker: ${needle}`)
    failed = true
  }
}

for (const needle of required) {
  if (!content.includes(needle)) {
    console.error(`FAIL: required marker missing: ${needle}`)
    failed = true
  }
}

if (content.includes("draftOrders.domain")) {
  console.error(
    "FAIL: native draft-order list UI still bundled (draftOrders.domain)"
  )
  failed = true
}

if (failed) {
  process.exit(1)
}

console.log(`OK: skrepay draft orders UI (${mainBundle}, ${content.length} bytes)`)
