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
const redirectPath = process.argv[2] || "/app/orders"

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
const bridge = new URL("/skrepay/session-bridge", base)
bridge.searchParams.set("token", token)
bridge.searchParams.set("redirect", redirectPath)

console.log("LOGIN (recomendado):")
console.log("https://skrepay.com/login")
console.log("")
console.log("ACCESO DIRECTO AL PANEL:")
console.log(bridge.toString())
console.log("")
console.log("REGIONES (después del login):")
console.log(`${base.replace(/\/$/, "")}/app/settings/regions`)
