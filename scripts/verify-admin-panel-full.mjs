/**
 * Verificación integral del panel admin Medusa + Skrepay (producción).
 * Prueba cada sección principal con sesión cookie (como el navegador).
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

  if (!loginRes.ok) {
    throw new Error(`Login failed: ${loginRes.status}`)
  }

  const { token } = await loginRes.json()
  const bridgeRes = await fetch(
    `${base}/skrepay/session-bridge?token=${encodeURIComponent(token)}`,
    { redirect: "manual" }
  )

  const cookieHeader = (bridgeRes.headers.getSetCookie?.() ?? [])
    .map((c) => c.split(";")[0])
    .join("; ")

  return {
    bearer: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cookie: { Cookie: cookieHeader, "Content-Type": "application/json" },
  }
}

async function probe(section, label, method, path, body, headers, expectOk = true) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  const text = await res.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    // ignore
  }

  const ok = expectOk ? res.ok : true
  const entry = {
    section,
    label,
    method,
    path: path.split("?")[0],
    status: res.status,
    pass: ok,
    note: "",
  }

  if (!res.ok && expectOk) {
    entry.note = text.slice(0, 200).replace(/\s+/g, " ")
  }

  if (res.ok && json && typeof json === "object") {
    const countKey = Object.keys(json).find((k) =>
      ["count", "total", "length"].includes(k) || Array.isArray(json[k])
    )
    if (countKey && Array.isArray(json[countKey])) {
      entry.note = `items=${json[countKey].length}`
    } else if (json.count !== undefined) {
      entry.note = `count=${json.count}`
    }
  }

  results.push(entry)
  const mark = entry.pass ? "PASS" : "FAIL"
  console.log(`[${mark}] ${section} / ${label}: ${res.status} ${entry.note}`)
  return { status: res.status, json, ok: res.ok }
}

const auth = await login()
const h = auth.cookie

console.log("\n=== AUTH & SESIÓN ===")
await probe("Auth", "users/me", "GET", "/admin/users/me", null, h)
await probe("Auth", "health", "GET", "/health", null, {}, false)

console.log("\n=== INICIO / DASHBOARD ===")
await probe("Dashboard", "stores", "GET", "/admin/stores", null, h)
await probe("Dashboard", "orders recientes", "GET", "/admin/orders?limit=5&order=-created_at", null, h)
await probe("Dashboard", "productos recientes", "GET", "/admin/products?limit=5&order=-created_at", null, h)

console.log("\n=== PEDIDOS ===")
const orders = await probe("Pedidos", "lista", "GET", "/admin/orders?limit=10", null, h)
const orderId = orders.json?.orders?.[0]?.id
if (orderId) {
  await probe("Pedidos", "detalle", "GET", `/admin/orders/${orderId}`, null, h)
}

console.log("\n=== BORRADORES (DRAFT ORDERS) ===")
const listFields =
  "+customer.*,+sales_channel.*,+email,+display_id,+total,+currency_code,+items.*,+items.variant.*,+region.*"
await probe("Borradores", "lista", "GET", "/admin/draft-orders?limit=10&order=-created_at", null, h)
const drafts = await probe(
  "Borradores",
  "lista con relaciones",
  "GET",
  `/admin/draft-orders?limit=5&fields=${encodeURIComponent(listFields)}`,
  null,
  h
)
const draftId = drafts.json?.draft_orders?.[0]?.id
const draft = drafts.json?.draft_orders?.[0]
if (draft && !draft.sales_channel && draft.sales_channel_id) {
  results.push({
    section: "Borradores",
    label: "join sales_channel",
    method: "GET",
    path: "/admin/draft-orders",
    status: 200,
    pass: false,
    note: `sales_channel undefined for ${draft.sales_channel_id}`,
  })
  console.log("[FAIL] Borradores / join sales_channel: sales_channel undefined")
} else if (draft?.sales_channel?.name) {
  console.log(`[PASS] Borradores / join sales_channel: ${draft.sales_channel.name}`)
}

const regions = await probe("Borradores", "regiones (crear)", "GET", "/admin/regions?limit=10", null, h)
const regionId = regions.json?.regions?.[0]?.id
const customers = await probe("Borradores", "clientes", "GET", "/admin/customers?limit=10&fields=id,email", null, h)
const customerId = customers.json?.customers?.[0]?.id
await probe("Borradores", "canales venta", "GET", "/admin/sales-channels?limit=10", null, h)
const products = await probe(
  "Borradores",
  "productos",
  "GET",
  "/admin/products?limit=5&fields=id,title,+variants.id",
  null,
  h
)
const variantId = products.json?.products?.[0]?.variants?.[0]?.id

if (regionId) {
  const created = await probe("Borradores", "crear", "POST", "/admin/draft-orders", {
    region_id: regionId,
    email: `panel-audit-${Date.now()}@skrepay.shop`,
    ...(customerId ? { customer_id: customerId } : {}),
  }, h)

  const newDraftId = created.json?.draft_order?.id
  if (newDraftId && variantId) {
    await probe("Borradores", "edit begin", "POST", `/admin/draft-orders/${newDraftId}/edit`, {}, h)
    await probe("Borradores", "añadir item", "POST", `/admin/draft-orders/${newDraftId}/edit/items`, {
      items: [{ variant_id: variantId, quantity: 1 }],
    }, h)
    await probe("Borradores", "confirm edit", "POST", `/admin/draft-orders/${newDraftId}/edit/confirm`, {}, h)
    await probe("Borradores", "eliminar", "DELETE", `/admin/draft-orders/${newDraftId}`, null, h)
  }
}

if (draftId) {
  await probe("Borradores", "detalle", "GET", `/admin/draft-orders/${draftId}?fields=id,email,*items,+customer.email,+sales_channel.name,+region.name`, null, h)
}

console.log("\n=== PRODUCTOS ===")
const prodList = await probe("Productos", "lista", "GET", "/admin/products?limit=10", null, h)
const prodId = prodList.json?.products?.[0]?.id
if (prodId) {
  await probe("Productos", "detalle", "GET", `/admin/products/${prodId}?fields=id,title,*variants,+variants.prices.*`, null, h)
}
await probe("Productos", "variantes", "GET", "/admin/product-variants?limit=10", null, h)
await probe("Productos", "categorías", "GET", "/admin/product-categories?limit=10", null, h)
await probe("Productos", "tipos", "GET", "/admin/product-types?limit=10", null, h)
await probe("Productos", "etiquetas", "GET", "/admin/product-tags?limit=10", null, h)
await probe("Productos", "colecciones", "GET", "/admin/collections?limit=10", null, h)
await probe("Productos", "precios Skrepay", "GET", "/admin/skrepay/pricing-currencies", null, h)

console.log("\n=== INVENTARIO ===")
const locs = await probe("Inventario", "ubicaciones", "GET", "/admin/stock-locations?limit=10", null, h)
const locationId = locs.json?.stock_locations?.[0]?.id
await probe("Inventario", "items", "GET", "/admin/inventory-items?limit=10&fields=id,sku,title,+location_levels.*", null, h)
await probe("Inventario", "reservas", "GET", "/admin/reservations?limit=10", null, h)

const invCreate = await probe("Inventario", "crear item", "POST", "/admin/inventory-items", {
  sku: `panel-audit-${Date.now()}`,
  title: "Panel audit item",
  requires_shipping: true,
  ...(locationId ? { location_levels: [{ location_id: locationId, stocked_quantity: 1 }] } : {}),
}, h)
const invId = invCreate.json?.inventory_item?.id
if (invId) {
  await probe("Inventario", "detalle item", "GET", `/admin/inventory-items/${invId}?fields=id,sku,*location_levels`, null, h)
  await probe("Inventario", "actualizar stock", "POST", `/admin/inventory-items/${invId}/location-levels/${locationId}`, {
    stocked_quantity: 2,
  }, h)
  await probe("Inventario", "eliminar item", "DELETE", `/admin/inventory-items/${invId}`, null, h)
}

if (locationId) {
  await probe("Inventario", "ubicación detalle", "GET", `/admin/stock-locations/${locationId}`, null, h)
}

console.log("\n=== CLIENTES ===")
await probe("Clientes", "lista", "GET", "/admin/customers?limit=10", null, h)
await probe("Clientes", "grupos", "GET", "/admin/customer-groups?limit=10", null, h)

console.log("\n=== CONFIGURACIÓN / REGIONES ===")
const regList = await probe("Regiones", "lista", "GET", "/admin/regions?limit=10", null, h)
const regId = regList.json?.regions?.[0]?.id
if (regId) {
  await probe("Regiones", "detalle", "GET", `/admin/regions/${regId}`, null, h)
}
await probe("Regiones", "tax regions", "GET", "/admin/tax-regions?limit=10", null, h)
await probe("Regiones", "países Skrepay", "GET", "/admin/skrepay/countries", null, h)
await probe("Regiones", "monedas Skrepay", "GET", "/admin/skrepay/region-currencies", null, h)
await probe("Regiones", "impuestos Skrepay", "GET", `/admin/skrepay/region-taxes${regId ? `?region_id=${regId}` : ""}`, null, h)

console.log("\n=== CONFIGURACIÓN / TIENDA ===")
const stores = await probe("Tienda", "stores", "GET", "/admin/stores", null, h)
const storeId = stores.json?.stores?.[0]?.id
if (storeId) {
  await probe("Tienda", "store detalle", "GET", `/admin/stores/${storeId}`, null, h)
  await probe("Tienda", "impuesto moneda local", "GET", "/admin/skrepay/store-local-currency-tax", null, h)
}
await probe("Tienda", "canales venta", "GET", "/admin/sales-channels?limit=10", null, h)
await probe("Tienda", "price preferences", "GET", "/admin/price-preferences?limit=10", null, h)
await probe("Tienda", "return reasons", "GET", "/admin/return-reasons?limit=10", null, h)
await probe("Tienda", "refund reasons", "GET", "/admin/refund-reasons?limit=10", null, h)

console.log("\n=== ENVÍO Y CUMPLIMIENTO ===")
await probe("Envío", "shipping options", "GET", "/admin/shipping-options?limit=10", null, h)
await probe("Envío", "shipping profiles", "GET", "/admin/shipping-profiles?limit=10", null, h)
await probe("Envío", "fulfillment providers", "GET", "/admin/fulfillment-providers?limit=10", null, h)

console.log("\n=== PROMOCIONES Y PRECIOS ===")
await probe("Promociones", "promotions", "GET", "/admin/promotions?limit=10", null, h)
await probe("Promociones", "campaigns", "GET", "/admin/campaigns?limit=10", null, h)
await probe("Promociones", "price lists", "GET", "/admin/price-lists?limit=10", null, h)

console.log("\n=== USUARIOS Y API KEYS ===")
await probe("Usuarios", "lista users", "GET", "/admin/users?limit=10", null, h)
await probe("Usuarios", "invites", "GET", "/admin/invites?limit=10", null, h)
await probe("API Keys", "publishable", "GET", "/admin/api-keys?type=publishable&limit=10", null, h)
await probe("API Keys", "secret", "GET", "/admin/api-keys?type=secret&limit=10", null, h)

console.log("\n=== OTROS ===")
await probe("Otros", "notifications", "GET", "/admin/notifications?limit=5", null, h)
await probe("Otros", "workflows", "GET", "/admin/workflows-executions?limit=5", null, h)

// Resumen
const passed = results.filter((r) => r.pass).length
const failed = results.filter((r) => !r.pass)
const bySection = {}

for (const r of results) {
  if (!bySection[r.section]) {
    bySection[r.section] = { pass: 0, fail: 0 }
  }
  if (r.pass) bySection[r.section].pass++
  else bySection[r.section].fail++
}

console.log("\n" + "=".repeat(60))
console.log(`RESUMEN: ${passed}/${results.length} pruebas OK`)
console.log("=".repeat(60))

for (const [section, stats] of Object.entries(bySection)) {
  const icon = stats.fail === 0 ? "OK" : "WARN"
  console.log(`  [${icon}] ${section}: ${stats.pass} ok, ${stats.fail} fallos`)
}

if (failed.length) {
  console.log("\nFALLOS:")
  for (const f of failed) {
    console.log(`  - ${f.section} / ${f.label}: HTTP ${f.status} ${f.note}`)
  }
}

const reportPath = resolve(dirname(fileURLToPath(import.meta.url)), "admin-panel-audit-report.json")
writeFileSync(reportPath, JSON.stringify({ at: new Date().toISOString(), base, passed, total: results.length, bySection, failed, results }, null, 2))
console.log(`\nReporte: ${reportPath}`)

process.exit(failed.length > 0 ? 1 : 0)
