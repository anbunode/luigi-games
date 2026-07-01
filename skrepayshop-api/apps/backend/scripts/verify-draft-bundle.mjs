import { readFileSync, readdirSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const assetsDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../.medusa/server/public/admin/assets"
)

const bundles = readdirSync(assetsDir)
  .filter((name) => name.startsWith("index-") && name.endsWith(".js"))
  .map((name) => ({
    name,
    size: readFileSync(resolve(assetsDir, name)).length,
    content: readFileSync(resolve(assetsDir, name), "utf8"),
  }))
  .sort((a, b) => b.size - a.size)

const main = bundles[0]
console.log("main bundle:", main.name, main.size)

const forbidden = [
  ["custom Spanish list", "Cargando borradores"],
  ["custom composer email", "borrador@pendiente.local"],
  ["custom order CTA", "Usa un borrador"],
  ['custom route /borradores', 'path:"/borradores"'],
]

const required = [
  ["native draft list route", 'path:"/draft-orders"'],
  ["native draft domain", "draftOrders.domain"],
  ["native items route", "/draft-orders/:id/items"],
  ["native convert action", "convert-to-order"],
]

let failed = false

for (const [label, needle] of forbidden) {
  const found = main.content.includes(needle)
  console.log(`${label} (must be false):`, found)
  if (found) failed = true
}

for (const [label, needle] of required) {
  const found = main.content.includes(needle)
  console.log(`${label} (must be true):`, found)
  if (!found) failed = true
}

process.exit(failed ? 1 : 0)
