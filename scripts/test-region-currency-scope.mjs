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

const base = process.env.API_BASE_URL || "https://skrepayshop-api.onrender.com"
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

const store = await (await fetch(`${base}/admin/stores`, { headers })).json()
const storeCount = store.stores?.[0]?.supported_currencies?.length ?? 0

const region = await (await fetch(`${base}/admin/skrepay/region-currencies`, { headers })).json()
const regionCount = region.supported_currencies?.length ?? 0

console.log("store (catalog) currencies:", storeCount)
console.log("region-currencies endpoint:", regionCount)
console.log(storeCount < regionCount ? "isolated OK" : "check isolation")
