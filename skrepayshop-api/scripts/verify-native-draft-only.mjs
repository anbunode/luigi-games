/**
 * Falla si el bundle admin incluye UI custom de borradores (no Medusa nativo).
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
  "Cargando borradores",
  "borrador@pendiente.local",
  'path:"/borradores"',
  "order-create-draft-cta",
  "DraftOrderComposer",
]

const required = ['path:"/draft-orders"', "draftOrders.domain"]

let mainBundle = ""

try {
  const files = readdirSync(assetsDir)
  mainBundle = files.find((f) => /^index-.+\.js$/.test(f) && f !== "index-CX2q6FwY.js") ?? ""
} catch (error) {
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
    console.error(`FAIL: custom draft UI marker found: ${needle}`)
    failed = true
  }
}

for (const needle of required) {
  if (!content.includes(needle)) {
    console.error(`FAIL: native draft plugin marker missing: ${needle}`)
    failed = true
  }
}

if (failed) {
  process.exit(1)
}

console.log(`OK: native draft only (${mainBundle}, ${content.length} bytes)`)
