import { readFileSync } from "fs"
import { readdirSync } from "fs"
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

const checks = [
  ["custom Spanish list (should be false)", "Cargando borradores"],
  ["custom composer (should be false)", "borrador@pendiente.local"],
  ["native draft plugin", "@medusajs/draft-order"],
  ["medusa draft items route", "/draft-orders/:id/items"],
  ["medusa convert", "convert-to-order"],
  ["order draft link widget", "Usa un borrador"],
  ["plugin draft list path", 'path:"/draft-orders"'],
]

for (const [label, needle] of checks) {
  console.log(`${label}:`, main.content.includes(needle))
}
