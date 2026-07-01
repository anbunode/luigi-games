import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../skrepayshop-api/apps/backend")
function loadEnv(n) {
  const r = readFileSync(resolve(backendRoot, ".env"), "utf8")
  for (const l of r.split(/\r?\n/)) {
    if (l.startsWith(n + "=")) return l.slice(n.length + 1).trim().replace(/^["']|["']$/g, "")
  }
  return ""
}

const base = "https://skrepayshop-api.onrender.com"
const email = loadEnv("LUIGI_ADMIN_EMAIL") || "gmzulia01@gmail.com"
const password = loadEnv("LUIGI_ADMIN_PASSWORD") || loadEnv("TEST_ADMIN_PASSWORD")

const login = await fetch(`${base}/skrepay/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
})
const { token } = await login.json()
const h = { Authorization: `Bearer ${token}` }

const fields =
  "id,display_id,created_at,email,status,currency_code,total,+customer.email,+sales_channel.name,+region.name"
const list = await fetch(
  `${base}/admin/draft-orders?limit=50&order=-created_at&fields=${encodeURIComponent(fields)}`,
  { headers: h }
).then((r) => r.json())

const issues = []
for (const d of list.draft_orders ?? []) {
  if (!d.currency_code) issues.push({ id: d.id, issue: "missing currency_code" })
  if (d.total == null) issues.push({ id: d.id, issue: "null total" })
  if (!d.region) issues.push({ id: d.id, issue: "missing region relation" })
  if (!d.sales_channel) issues.push({ id: d.id, issue: "missing sales_channel relation" })
  if (!d.email) issues.push({ id: d.id, issue: "missing email" })
}

console.log("drafts:", list.draft_orders?.length, "issues:", issues.length)
for (const i of issues.slice(0, 20)) console.log(i)

// detail page fields from bundle (heavy)
const DETAIL =
  "*items,+items.variant.*,+items.variant.product.*,+region.*,+customer.*,+sales_channel.*,+shipping_methods.*,+payment_collections.*,+fulfillments.*"
const first = list.draft_orders?.[0]
if (first) {
  const detail = await fetch(
    `${base}/admin/draft-orders/${first.id}?fields=${encodeURIComponent(DETAIL)}`,
    { headers: h }
  )
  console.log("\ndetail", first.id, detail.status, (await detail.text()).slice(0, 500))
}

// create page deps
for (const path of [
  "/admin/regions?limit=50&fields=id,name,currency_code",
  "/admin/sales-channels?limit=50",
  "/admin/currencies",
  "/admin/stores",
]) {
  const r = await fetch(`${base}${path}`, { headers: h })
  console.log(path, r.status)
}

// admin bundle
const html = await fetch(`${base}/app`).then((r) => r.text())
const bundle = html.match(/index-[^"']+\.js/)?.[0]
console.log("\nbundle:", bundle)
if (bundle) {
  const js = await fetch(`${base}/app/assets/${bundle}`).then((r) => r.text())
  console.log("has draft-orders route:", js.includes('path:"/draft-orders"'))
  console.log("has draft-order plugin:", js.includes("draftOrders"))
  console.log("has ErrorBoundary draft:", js.includes("draft-orders"))
}
