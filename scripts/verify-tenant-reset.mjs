import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../skrepayshop-api/apps/backend")

function loadEnv(name) {
  const raw = readFileSync(resolve(backendRoot, ".env"), "utf8")
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith(`${name}=`)) return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "")
  }
  return ""
}

const base = "https://skrepayshop-api.onrender.com"
const email = loadEnv("LUIGI_ADMIN_EMAIL") || "gmzulia01@gmail.com"
const password = loadEnv("LUIGI_ADMIN_PASSWORD") || loadEnv("TEST_ADMIN_PASSWORD")

const loginRes = await fetch(`${base}/skrepay/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
})
const { token } = await loginRes.json()
const bridgeRes = await fetch(`${base}/skrepay/session-bridge?token=${encodeURIComponent(token)}`, { redirect: "manual" })
const cookieHeader = (bridgeRes.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ")
const headers = { Cookie: cookieHeader }

const store = (await (await fetch(`${base}/admin/stores`, { headers })).json()).stores?.[0]
console.log("store currencies:", store?.supported_currencies?.map((c) => `${c.currency_code}${c.is_default ? " (default)" : ""}`))
console.log("default_region_id:", store?.default_region_id)

const regions = await (await fetch(`${base}/admin/regions?limit=50`, { headers })).json()
console.log("regions:", (regions.regions ?? []).map((r) => r.name))

const pricing = await (await fetch(`${base}/admin/skrepay/pricing-currencies`, { headers })).json()
console.log("pricing currencies:", pricing.supported_currencies?.map((c) => c.currency_code))

const taxes = await (await fetch(`${base}/admin/skrepay/region-taxes`, { headers })).json()
console.log("region taxes:", (taxes.region_taxes ?? []).length)
