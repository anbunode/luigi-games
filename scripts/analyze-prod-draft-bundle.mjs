const base = "https://skrepayshop-api.onrender.com"
const app = await fetch(`${base}/app`)
const html = await app.text()
const match = html.match(/assets\/index-([A-Za-z0-9_-]+)\.js/)
const bundle = match?.[0]
if (!bundle) {
  console.log("no bundle found")
  process.exit(1)
}

const res = await fetch(`${base}/app/${bundle}`)
const s = await res.text()

const checks = [
  "Usa un borrador",
  "Cargando borradores",
  "borrador@pendiente.local",
  '/path:"/borradores"',
  'path:"/draft-orders"',
  "draftOrders.domain",
  "StoreSettingsShopifyPage",
  "@medusajs/draft-order",
  "Draft Order",
  "Create draft order",
]

for (const c of checks) {
  console.log(`${c}: ${s.includes(c)}`)
}

console.log("bundle:", bundle, "size:", s.length)
