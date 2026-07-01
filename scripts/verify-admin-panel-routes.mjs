/**
 * Verifica rutas UI del panel (/app/*) con sesión cookie.
 * Detecta páginas con errores visibles o APIs fallidas en carga inicial.
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
const appBase = base.replace(/\/$/, "") + "/app"
const email = loadEnv("LUIGI_ADMIN_EMAIL") || "gmzulia01@gmail.com"
const password = loadEnv("LUIGI_ADMIN_PASSWORD") || loadEnv("TEST_ADMIN_PASSWORD")

const ROUTES = [
  { section: "Inicio", path: "/orders" },
  { section: "Borradores", path: "/draft-orders" },
  { section: "Productos", path: "/products" },
  { section: "Inventario", path: "/inventory" },
  { section: "Clientes", path: "/customers" },
  { section: "Promociones", path: "/promotions" },
  { section: "Listas precio", path: "/price-lists" },
  { section: "Config / Tienda", path: "/settings/store" },
  { section: "Config / Regiones", path: "/settings/regions" },
  { section: "Config / Impuestos", path: "/settings/tax-regions" },
  { section: "Config / Ubicaciones", path: "/settings/locations" },
  { section: "Config / Canales", path: "/settings/sales-channels" },
  { section: "Config / API keys", path: "/settings/publishable-api-keys" },
  { section: "Config / Usuarios", path: "/settings/users" },
  { section: "Config / Devoluciones", path: "/settings/return-reasons" },
]

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

const cookieHeaders = { Cookie: cookieHeader }

// APIs que cada ruta suele cargar al abrir
const ROUTE_APIS = {
  "/orders": ["/admin/orders", "/admin/stores"],
  "/draft-orders": ["/admin/draft-orders", "/admin/regions", "/admin/sales-channels"],
  "/products": ["/admin/products"],
  "/inventory": ["/admin/inventory-items", "/admin/stock-locations"],
  "/customers": ["/admin/customers"],
  "/promotions": ["/admin/promotions"],
  "/price-lists": ["/admin/price-lists"],
  "/settings/store": ["/admin/stores"],
  "/settings/regions": ["/admin/regions", "/admin/stores"],
  "/settings/tax-regions": ["/admin/tax-regions"],
  "/settings/locations": ["/admin/stock-locations"],
  "/settings/sales-channels": ["/admin/sales-channels"],
  "/settings/publishable-api-keys": ["/admin/api-keys"],
  "/settings/users": ["/admin/users"],
  "/settings/return-reasons": ["/admin/return-reasons"],
}

const results = []

for (const route of ROUTES) {
  const apis = ROUTE_APIS[route.path] ?? []
  const apiResults = []

  for (const api of apis) {
    const res = await fetch(`${base}${api}?limit=5`, { headers: cookieHeaders })
    apiResults.push({ api, status: res.status, ok: res.ok })
  }

  const htmlRes = await fetch(`${appBase}${route.path}`, {
    headers: cookieHeaders,
    redirect: "follow",
  })
  const html = await htmlRes.text()
  const hasAppShell = html.includes("id=\"medusa\"") || html.includes("/assets/index-")
  const apiFails = apiResults.filter((a) => !a.ok)

  const pass = htmlRes.ok && hasAppShell && apiFails.length === 0
  results.push({
    section: route.section,
    path: route.path,
    htmlStatus: htmlRes.status,
    hasAppShell,
    apis: apiResults,
    pass,
  })

  const mark = pass ? "PASS" : "FAIL"
  console.log(
    `[${mark}] ${route.section} (${route.path}) html=${htmlRes.status} shell=${hasAppShell} apis=${apiResults.map((a) => a.status).join(",")}`
  )
  if (apiFails.length) {
    for (const f of apiFails) {
      console.log(`       API fail: ${f.api} -> ${f.status}`)
    }
  }
}

const failed = results.filter((r) => !r.pass)
console.log(`\nUI rutas: ${results.length - failed.length}/${results.length} OK`)

const reportPath = resolve(dirname(fileURLToPath(import.meta.url)), "admin-panel-ui-routes-report.json")
writeFileSync(reportPath, JSON.stringify({ at: new Date().toISOString(), results }, null, 2))
process.exit(failed.length > 0 ? 1 : 0)
