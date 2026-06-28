/**
 * Diagnose product create flow
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

for (const path of [
  "/admin/products?limit=3",
  "/admin/product-types",
  "/admin/product-tags",
  "/admin/sales-channels",
  "/admin/stores",
]) {
  const res = await fetch(`${base}${path}`, { headers })
  console.log(`GET ${path}`, res.status, (await res.text()).slice(0, 200))
}

const createRes = await fetch(`${base}/admin/products`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    title: "Test Product Skrepay",
    status: "draft",
    options: [{ title: "Default", values: ["Default"] }],
    variants: [
      {
        title: "Default",
        options: { Default: "Default" },
        prices: [{ amount: 1000, currency_code: "eur" }],
      },
    ],
  }),
})
console.log("\nPOST /admin/products", createRes.status, await createRes.text())
