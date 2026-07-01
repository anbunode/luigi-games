/**
 * Verifica el flujo oficial de Draft Orders (plugin @medusajs/draft-order).
 * Equivalente API del user guide: crear → items → confirmar → convertir a pedido.
 *
 * Docs: https://docs.medusajs.com/user-guide/orders/draft-orders/manage
 * Plugin: https://docs.medusajs.com/resources/commerce-modules/order/draft-orders
 */
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const backendRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../skrepayshop-api/apps/backend"
)

function loadEnv(name) {
  const raw = readFileSync(resolve(backendRoot, ".env"), "utf8")
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith(`${name}=`)) {
      return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "")
    }
  }
  return ""
}

const base = process.env.API_BASE_URL || "https://skrepayshop-api.onrender.com"
const email = loadEnv("LUIGI_ADMIN_EMAIL") || "gmzulia01@gmail.com"
const password = loadEnv("LUIGI_ADMIN_PASSWORD") || loadEnv("TEST_ADMIN_PASSWORD")

const steps = []
let failed = false

function record(step, pass, detail = "") {
  steps.push({ step, pass, detail })
  console.log(`[${pass ? "PASS" : "FAIL"}] ${step}${detail ? ` — ${detail}` : ""}`)
  if (!pass) failed = true
}

const loginRes = await fetch(`${base}/skrepay/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
})
if (!loginRes.ok) {
  record("Login", false, String(loginRes.status))
  process.exit(1)
}
const { token } = await loginRes.json()
const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
record("Login", true)

async function api(method, path, body) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  let json = null
  const text = await res.text()
  try {
    json = JSON.parse(text)
  } catch {
    // ignore
  }
  return { res, json, text }
}

// 1. List draft orders (Orders → Draft orders)
const list = await api("GET", "/admin/draft-orders?limit=5&order=-created_at")
record("List draft orders", list.res.ok, `HTTP ${list.res.status}`)

// 2. Create draft order (region + email)
const regions = await api("GET", "/admin/regions?limit=1&fields=id,name,currency_code")
const regionId = regions.json?.regions?.[0]?.id
record("Load regions for create form", regions.res.ok && Boolean(regionId))

const customers = await api("GET", "/admin/customers?limit=1&fields=id,email")
const customerId = customers.json?.customers?.[0]?.id

const products = await api(
  "GET",
  "/admin/products?limit=1&fields=id,title,+variants.id,+variants.prices.*"
)
const variantId = products.json?.products?.[0]?.variants?.[0]?.id
record("Load products for add items", products.res.ok && Boolean(variantId))

const create = await api("POST", "/admin/draft-orders", {
  region_id: regionId,
  email: `medusa-guide-${Date.now()}@skrepay.shop`,
  ...(customerId ? { customer_id: customerId } : {}),
})
const draftId = create.json?.draft_order?.id
record("Create draft order", create.res.ok && Boolean(draftId), draftId ?? create.text.slice(0, 120))

if (!draftId) {
  process.exit(1)
}

// 3. Begin edit + add catalog product + confirm (Manage items)
const editBegin = await api("POST", `/admin/draft-orders/${draftId}/edit`, {})
record("Begin order edit", editBegin.res.ok)

const addItem = await api("POST", `/admin/draft-orders/${draftId}/edit/items`, {
  items: [{ variant_id: variantId, quantity: 1 }],
})
record("Add product to draft", addItem.res.ok)

const confirmEdit = await api("POST", `/admin/draft-orders/${draftId}/edit/confirm`, {})
record("Confirm item changes", confirmEdit.res.ok)

// 4. View draft detail with relations (native list/detail fields)
const detail = await api(
  "GET",
  `/admin/draft-orders/${draftId}?fields=id,email,status,total,*items,+customer.email,+sales_channel.name,+region.name`
)
const draft = detail.json?.draft_order
record(
  "View draft detail",
  detail.res.ok && Boolean(draft?.items?.length),
  `items=${draft?.items?.length ?? 0} total=${draft?.total ?? "?"}`
)

// 5. Convert draft to order (Mark as paid / complete — convert-to-order)
const convert = await api("POST", `/admin/draft-orders/${draftId}/convert-to-order`, {})
const orderId = convert.json?.order?.id
record(
  "Convert draft to order",
  convert.res.ok && Boolean(orderId),
  orderId ?? convert.text.slice(0, 120)
)

if (orderId) {
  const order = await api("GET", `/admin/orders/${orderId}?fields=id,status,email,total`)
  record(
    "Verify converted order",
    order.res.ok && order.json?.order?.status !== "draft",
    order.json?.order?.status
  )
}

console.log("\n" + "=".repeat(50))
console.log(failed ? "USER GUIDE FLOW: FAILED" : "USER GUIDE FLOW: OK (native Medusa plugin)")
process.exit(failed ? 1 : 0)
