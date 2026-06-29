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

const base =
  process.env.API_BASE_URL ||
  loadEnv("MEDUSA_BACKEND_URL") ||
  "https://skrepayshop-api.onrender.com"
const email = loadEnv("LUIGI_ADMIN_EMAIL") || "gmzulia01@gmail.com"
const password = loadEnv("LUIGI_ADMIN_PASSWORD") || loadEnv("TEST_ADMIN_PASSWORD")

const loginRes = await fetch(`${base}/skrepay/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
})

if (!loginRes.ok) {
  console.error("Login failed", loginRes.status, await loginRes.text())
  process.exit(1)
}

const { token } = await loginRes.json()

const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
}

for (const path of [
  "/admin/draft-orders?limit=5&order=-created_at",
  "/admin/orders?limit=5&is_draft_order=true",
]) {
  const res = await fetch(`${base}${path}`, { headers })
  const text = await res.text()
  console.log(`\n=== GET ${path} ===`)
  console.log("status:", res.status)
  console.log(text.slice(0, 2000))
}
