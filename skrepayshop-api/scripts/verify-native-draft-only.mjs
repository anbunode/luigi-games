/**
 * Verifica que el admin use la UI Skrepay de borradores (no el plugin nativo roto).
 * Usa el bundle index-*.js más grande (mismo criterio que verify-draft-bundle.mjs).
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
  "draftOrders.domain",
]

const required = [
  "data-skrepay-draft-orders-shell",
  'path:"/draft-orders"',
]

let bundles
try {
  bundles = readdirSync(assetsDir)
    .filter((name) => name.startsWith("index-") && name.endsWith(".js"))
    .map((name) => ({
      name,
      size: readFileSync(resolve(assetsDir, name)).length,
      content: readFileSync(resolve(assetsDir, name), "utf8"),
    }))
    .sort((a, b) => b.size - a.size)
} catch {
  console.error("No admin assets — run medusa build first")
  process.exit(1)
}

const main = bundles[0]
if (!main) {
  console.error("Main index bundle not found in", assetsDir)
  process.exit(1)
}

console.log("main bundle:", main.name, main.size)

let failed = false

for (const needle of forbidden) {
  if (main.content.includes(needle)) {
    console.error(`FAIL: forbidden marker: ${needle}`)
    failed = true
  }
}

for (const needle of required) {
  if (!main.content.includes(needle)) {
    console.error(`FAIL: required marker missing: ${needle}`)
    failed = true
  }
}

if (failed) {
  process.exit(1)
}

console.log(`OK: skrepay draft orders UI (${main.name}, ${main.content.length} bytes)`)
