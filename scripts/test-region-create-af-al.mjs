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

const body = {
  name: "LATAM Test Bearer",
  currency_code: "afn",
  countries: ["af", "al"],
  payment_providers: ["pp_system_default"],
}

for (const [label, headers] of [
  ["bearer", { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }],
  ["cookie", { Cookie: (await (await fetch(`${base}/skrepay/session-bridge?token=${encodeURIComponent(token)}`, { redirect: "manual" })).headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; "), "Content-Type": "application/json" }],
]) {
  const res = await fetch(`${base}/admin/regions`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })
  console.log(label, res.status, await res.text())
}
