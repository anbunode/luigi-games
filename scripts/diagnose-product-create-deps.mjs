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
const headers = { Authorization: `Bearer ${token}` }

const stores = await (await fetch(`${base}/admin/stores`, { headers })).json()
const scId = stores.stores?.[0]?.default_sales_channel_id
console.log("sales_channel_id", scId)

for (const path of [
  `/admin/sales-channels`,
  `/admin/sales-channels/${scId}`,
  `/admin/regions?limit=5`,
  `/admin/price-preferences?limit=5`,
]) {
  const res = await fetch(`${base}${path}`, { headers })
  console.log(`GET ${path}`, res.status, (await res.text()).slice(0, 250))
}
