/**
 * Verifica login tenant + endpoints admin (solo códigos HTTP, sin tokens).
 * Credenciales: LUIGI_ADMIN_EMAIL / LUIGI_ADMIN_PASSWORD en .env o env.
 */
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../skrepayshop-api/apps/backend")
const base = process.env.API_BASE_URL || "https://skrepayshop-api.onrender.com"

function loadEnv(name) {
  if (process.env[name]) return process.env[name].trim()
  try {
    const raw = readFileSync(resolve(backendRoot, ".env"), "utf8")
    for (const line of raw.split(/\r?\n/)) {
      if (line.startsWith(`${name}=`)) {
        return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "")
      }
    }
  } catch {
    // no .env
  }
  return ""
}

const email = loadEnv("LUIGI_ADMIN_EMAIL") || "gmzulia01@gmail.com"
const password = loadEnv("LUIGI_ADMIN_PASSWORD") || loadEnv("TEST_ADMIN_PASSWORD")

if (!password) {
  console.log(JSON.stringify({ ok: false, reason: "missing_password_env" }))
  process.exit(1)
}

const loginRes = await fetch(`${base}/skrepay/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
})

const loginStatus = loginRes.status
if (!loginRes.ok) {
  console.log(JSON.stringify({ ok: false, login: loginStatus }))
  process.exit(1)
}

const { token } = await loginRes.json()
const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString())
const hasTenantSlug = Boolean(payload.app_metadata?.tenant_slug)

const headers = { Authorization: `Bearer ${token}` }
const meStatus = (await fetch(`${base}/admin/users/me`, { headers })).status
const storesStatus = (await fetch(`${base}/admin/stores`, { headers })).status

console.log(
  JSON.stringify({
    ok: loginStatus === 200 && meStatus === 200 && storesStatus === 200,
    login: loginStatus,
    tenant_slug_in_jwt: hasTenantSlug,
    users_me: meStatus,
    stores: storesStatus,
  })
)
