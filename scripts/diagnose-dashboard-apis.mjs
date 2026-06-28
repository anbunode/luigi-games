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
console.log("login", loginRes.status)
const { token } = await loginRes.json()
const headers = { Authorization: `Bearer ${token}` }

for (const path of [
  "/admin/stores",
  "/admin/stores?currency_scope=catalog",
  "/admin/orders?limit=3",
  "/admin/products?limit=3",
  "/admin/draft-orders?limit=3",
]) {
  const res = await fetch(`${base}${path}`, { headers })
  const text = await res.text()
  console.log(`\nGET ${path}`, res.status, text.slice(0, 500))
}
