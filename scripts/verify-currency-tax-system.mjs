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

const storeRes = await fetch(`${base}/admin/stores`, { headers })
const storeBody = await storeRes.json()
const storeCodes =
  storeBody.stores?.[0]?.supported_currencies?.map((c) => c.currency_code) ?? []
const defaultCur = storeBody.stores?.[0]?.supported_currencies?.find(
  (c) => c.is_default
)?.currency_code

console.log(
  "store (always catalog)",
  storeRes.status,
  storeCodes.length,
  "default:",
  defaultCur,
  "sample:",
  storeCodes.slice(0, 4).join(", ")
)

const pricingRes = await fetch(`${base}/admin/skrepay/pricing-currencies`, {
  headers,
})
const pricingBody = await pricingRes.json()
const pricingCodes =
  pricingBody.supported_currencies?.map((c) => c.currency_code) ?? []

console.log(
  "pricing-currencies",
  pricingRes.status,
  pricingCodes.length,
  pricingCodes.join(", ")
)

// Header scope must no longer change store response
const scopedRes = await fetch(`${base}/admin/stores`, {
  headers: { ...headers, "x-skrepay-currency-scope": "pricing" },
})
const scopedBody = await scopedRes.json()
const scopedLen = scopedBody.stores?.[0]?.supported_currencies?.length ?? 0
console.log(
  "store with legacy pricing header (should still be catalog)",
  scopedRes.status,
  scopedLen
)

const taxRes = await fetch(`${base}/admin/skrepay/region-taxes`, { headers })
const taxBody = await taxRes.json()
console.log("\nregion-taxes", taxRes.status)
for (const region of taxBody.region_taxes ?? []) {
  console.log(
    `  ${region.region_name} automatic_taxes=${region.automatic_taxes}`,
    region.countries.map((c) => `${c.iso_2}:${c.tax_percent}%`).join(", ")
  )
}
