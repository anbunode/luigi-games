/**
 * Diagnose store update + price preferences for tenant
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

const loginRes = await fetch(`${base}/skrepay/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
})
const { token } = await loginRes.json()
const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }

const storesRes = await fetch(`${base}/admin/stores`, { headers })
const stores = await storesRes.json()
const storeId = stores.stores?.[0]?.id
console.log("storeId", storeId)

for (const path of [
  `/admin/stores/${storeId}`,
  `/admin/price-preferences?limit=5`,
  `/admin/currencies?limit=5`,
]) {
  const res = await fetch(`${base}${path}`, { headers })
  console.log(`GET ${path}`, res.status, (await res.text()).slice(0, 400))
}

// Try update store default currency
const updateRes = await fetch(`${base}/admin/stores/${storeId}`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    supported_currencies: [
      { currency_code: "eur", is_default: true },
      { currency_code: "usd", is_default: false },
      { currency_code: "vef", is_default: false },
    ],
  }),
})
console.log("POST /admin/stores/:id", updateRes.status, await updateRes.text())

// Try price preference
const ppRes = await fetch(`${base}/admin/price-preferences`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    attribute: "currency_code",
    value: "vef",
    is_tax_inclusive: true,
  }),
})
console.log("POST /admin/price-preferences", ppRes.status, await ppRes.text())
