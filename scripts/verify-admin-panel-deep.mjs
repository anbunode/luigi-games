/**
 * Flujos profundos: crear/actualizar en clientes, promociones, pedidos, borradores, inventario.
 */
import { readFileSync, writeFileSync } from "fs"
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

const results = []

async function login() {
  const loginRes = await fetch(`${base}/skrepay/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  const { token } = await loginRes.json()
  const bridgeRes = await fetch(
    `${base}/skrepay/session-bridge?token=${encodeURIComponent(token)}`,
    { redirect: "manual" }
  )
  const cookieHeader = (bridgeRes.headers.getSetCookie?.() ?? [])
    .map((c) => c.split(";")[0])
    .join("; ")
  return { Cookie: cookieHeader, "Content-Type": "application/json" }
}

async function probe(section, label, method, path, body, expectOk = true) {
  const opts = { method, headers: h }
  if (body != null && method !== "GET" && method !== "HEAD") {
    opts.body = JSON.stringify(body)
  }
  const res = await fetch(`${base}${path}`, opts)
  const text = await res.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    // ignore
  }
  const pass = expectOk ? res.ok : true
  results.push({ section, label, status: res.status, pass, note: text.slice(0, 160) })
  console.log(`[${pass ? "PASS" : "FAIL"}] ${section} / ${label}: ${res.status}`)
  if (!pass) console.log("  ", text.slice(0, 200))
  return { ok: res.ok, json }
}

const h = await login()

console.log("\n=== CLIENTES (CRUD) ===")
const createdCustomer = await probe("Clientes", "crear", "POST", "/admin/customers", {
  email: `audit-${Date.now()}@skrepay.shop`,
  first_name: "Audit",
  last_name: "Panel",
})
const customerId = createdCustomer.json?.customer?.id
if (customerId) {
  await probe(
    "Clientes",
    "detalle con campos",
    "GET",
    `/admin/customers/${customerId}?fields=id,email,first_name,last_name,phone,*addresses`,
    null
  )
  await probe("Clientes", "actualizar nombre", "POST", `/admin/customers/${customerId}`, {
    first_name: "AuditActualizado",
  })
  await probe("Clientes", "añadir dirección", "POST", `/admin/customers/${customerId}/addresses`, {
    first_name: "Audit",
    last_name: "Panel",
    address_1: "Calle Test 1",
    city: "Madrid",
    postal_code: "28001",
    country_code: "es",
  })
}

console.log("\n=== PROMOCIONES (CRUD) ===")
const code = `AUDIT${Date.now().toString().slice(-6)}`
const createdPromo = await probe("Promociones", "crear borrador", "POST", "/admin/promotions", {
  code,
  type: "standard",
  status: "draft",
  application_method: {
    type: "percentage",
    target_type: "order",
    value: 10,
    currency_code: "eur",
  },
})
const promoId = createdPromo.json?.promotion?.id
if (promoId) {
  await probe("Promociones", "detalle", "GET", `/admin/promotions/${promoId}`, null)
  await probe("Promociones", "activar", "POST", `/admin/promotions/${promoId}`, {
    status: "active",
  })
  const activated = await probe(
    "Promociones",
    "verificar activa",
    "GET",
    `/admin/promotions/${promoId}`,
    null
  )
  const isActive = activated.json?.promotion?.status === "active"
  results.push({
    section: "Promociones",
    label: "status active tras activar",
    status: isActive ? 200 : 0,
    pass: isActive,
    note: activated.json?.promotion?.status ?? "",
  })
  console.log(`[${isActive ? "PASS" : "FAIL"}] Promociones / status active tras activar`)
  await probe("Promociones", "eliminar", "DELETE", `/admin/promotions/${promoId}`, null)
}

console.log("\n=== PRODUCTOS (CREAR BORRADOR) ===")
const storesRes = await probe("Productos", "stores", "GET", "/admin/stores?limit=1", null)
const storeId = storesRes.json?.stores?.[0]?.id
if (storeId) {
  const createdProduct = await probe("Productos", "crear borrador", "POST", "/admin/products", {
    title: `Audit UI ${Date.now()}`,
    status: "draft",
    options: [{ title: "Default", values: ["Default"] }],
    variants: [
      {
        title: "Default",
        options: { Default: "Default" },
        prices: [{ amount: 1000, currency_code: "eur" }],
      },
    ],
  })
  const newProdId = createdProduct.json?.product?.id
  if (newProdId) {
    await probe(
      "Productos",
      "actualizar título",
      "POST",
      `/admin/products/${newProdId}`,
      { title: `Audit UI actualizado ${Date.now()}` }
    )
    await probe("Productos", "eliminar", "DELETE", `/admin/products/${newProdId}`, null)
  }
}

console.log("\n=== PEDIDOS (CAMPOS) ===")
const orders = await probe(
  "Pedidos",
  "lista campos",
  "GET",
  "/admin/orders?limit=3&fields=id,display_id,status,email,total,currency_code,subtotal,shipping_total,tax_total,*items,+customer.email,+region.name",
  null
)
const orderId = orders.json?.orders?.[0]?.id
if (orderId) {
  await probe(
    "Pedidos",
    "detalle completo",
    "GET",
    `/admin/orders/${orderId}?fields=id,display_id,status,email,total,subtotal,shipping_total,tax_total,discount_total,*items,*shipping_address,*billing_address,+customer.email`,
    null
  )
}

console.log("\n=== PRODUCTOS (CAMPOS) ===")
await probe(
  "Productos",
  "lista campos",
  "GET",
  "/admin/products?limit=3&fields=id,title,status,thumbnail,*variants,+variants.prices.*,+variants.sku",
  null
)
const prod = await probe("Productos", "lista", "GET", "/admin/products?limit=1", null)
const prodId = prod.json?.products?.[0]?.id
if (prodId) {
  await probe(
    "Productos",
    "detalle variantes precios",
    "GET",
    `/admin/products/${prodId}?fields=id,title,status,*variants,+variants.prices.*,+variants.inventory_items.*`,
    null
  )
}

console.log("\n=== INVENTARIO (NIVELES) ===")
const invList = await probe(
  "Inventario",
  "items con niveles",
  "GET",
  "/admin/inventory-items?limit=3&fields=id,sku,title,*location_levels",
  null
)
const invId = invList.json?.inventory_items?.[0]?.id
if (invId) {
  await probe(
    "Inventario",
    "detalle niveles",
    "GET",
    `/admin/inventory-items/${invId}?fields=id,sku,title,*location_levels`,
    null
  )
}

console.log("\n=== BORRADORES (METADATA VENCIMIENTO) ===")
const regions = await probe("Borradores", "regiones", "GET", "/admin/regions?limit=1", null)
const channels = await probe("Borradores", "canales", "GET", "/admin/sales-channels?limit=1", null)
const regionId = regions.json?.regions?.[0]?.id
const salesChannelId = channels.json?.sales_channels?.[0]?.id
if (regionId && salesChannelId) {
  const draft = await probe("Borradores", "crear", "POST", "/admin/draft-orders", {
    region_id: regionId,
    sales_channel_id: salesChannelId,
    email: `audit-meta-${Date.now()}@skrepay.shop`,
    shipping_address: {
      first_name: "Test",
      last_name: "Vencimiento",
      address_1: "Calle 1",
      city: "Madrid",
      postal_code: "28001",
      country_code: "es",
    },
  })
  const draftId = draft.json?.draft_order?.id
  if (draftId) {
    await probe("Borradores", "guardar vencimiento", "POST", `/admin/draft-orders/${draftId}`, {
      email: draft.json.draft_order.email,
      metadata: {
        skrepay_invoice_due_enabled: true,
        skrepay_payment_due_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      },
    })
    const got = await probe(
      "Borradores",
      "leer metadata",
      "GET",
      `/admin/draft-orders/${draftId}?fields=id,metadata,email`,
      null
    )
    const meta = got.json?.draft_order?.metadata
    const metaOk =
      meta?.skrepay_invoice_due_enabled === true &&
      typeof meta?.skrepay_payment_due_at === "string"
    results.push({
      section: "Borradores",
      label: "metadata vencimiento válido",
      status: metaOk ? 200 : 0,
      pass: metaOk,
      note: JSON.stringify(meta ?? {}),
    })
    console.log(`[${metaOk ? "PASS" : "FAIL"}] Borradores / metadata vencimiento válido`)
    await probe("Borradores", "eliminar", "DELETE", `/admin/draft-orders/${draftId}`, null)
  }
}

const failed = results.filter((r) => !r.pass)
console.log("\n" + "=".repeat(50))
console.log(`DEEP AUDIT: ${results.length - failed.length}/${results.length} OK`)
if (failed.length) {
  console.log("\nFALLOS:")
  for (const f of failed) {
    console.log(`  - ${f.section} / ${f.label}: ${f.status}`)
  }
}

const reportPath = resolve(dirname(fileURLToPath(import.meta.url)), "admin-panel-deep-audit.json")
writeFileSync(reportPath, JSON.stringify({ at: new Date().toISOString(), results, failed }, null, 2))
process.exit(failed.length > 0 ? 1 : 0)
