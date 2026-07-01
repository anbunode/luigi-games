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
  ["custom legacy CTA", "Usa un borrador"],
  ["legacy composer email", "borrador@pendiente.local"],
  ['custom route /borradores', 'path:"/borradores"'],
  ["native draft list UI", "draftOrders.domain"],
]

const requiredGroups = [
  {
    label: "skrepay draft routes",
    needles: ['path:"/draft-orders"', "data-skrepay-draft-orders-shell"],
    min: 2,
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
