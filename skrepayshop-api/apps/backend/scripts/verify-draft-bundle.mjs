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
  ["legacy borradores path", "/borradores"],
]

/** Pass if any marker group for the native @medusajs/draft-order plugin matches. */
const requiredGroups = [
  {
    label: "draft plugin (routes)",
    needles: ['path:"/draft-orders"', "/draft-orders/:id/items", "convert-to-order"],
    min: 1,
  },
  {
    label: "draft plugin (module)",
    needles: [
      "draftOrders.domain",
      "DRAFT_ORDERS_QUERY_KEY",
      "DraftOrder",
      "useDraftOrders",
    ],
    min: 1,
  },
]

let failed = false

for (const [label, needle] of forbidden) {
  const found = main.content.includes(needle)
  console.log(`${label} (must be false):`, found)
  if (found) failed = true
}

for (const group of requiredGroups) {
  const hits = group.needles.filter((n) => main.content.includes(n))
  const ok = hits.length >= group.min
  console.log(
    `${group.label} (need >=${group.min}):`,
    ok,
    ok ? hits.join(", ") : `found 0 of ${group.needles.join(" | ")}`
  )
  if (!ok) failed = true
}

process.exit(failed ? 1 : 0)
