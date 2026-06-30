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

const fields =
  "name,*sales_channels,*address,*fulfillment_sets,*fulfillment_sets.service_zones,*fulfillment_sets.service_zones.shipping_options,*fulfillment_sets.service_zones.shipping_options.shipping_profile"

const loginRes = await fetch(`${base}/skrepay/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
})

if (!loginRes.ok) {
  console.error("login failed", loginRes.status, await loginRes.text())
  process.exit(1)
}

const { token } = await loginRes.json()
const bridgeRes = await fetch(
  `${base}/skrepay/session-bridge?token=${encodeURIComponent(token)}`,
  { redirect: "manual" }
)
const cookieHeader = (bridgeRes.headers.getSetCookie?.() ?? [])
  .map((cookie) => cookie.split(";")[0])
  .join("; ")

const cookieHeaders = { Cookie: cookieHeader }
const bearerHeaders = { Authorization: `Bearer ${token}` }
const url = `${base}/admin/stock-locations?fields=${encodeURIComponent(fields)}&limit=20`

for (const [label, headers] of [
  ["cookie", cookieHeaders],
  ["bearer", bearerHeaders],
]) {
  const res = await fetch(url, { headers })
  const body = await res.text()
  console.log(`\n[${label}] status`, res.status)
  console.log(body.slice(0, 1500))
}
