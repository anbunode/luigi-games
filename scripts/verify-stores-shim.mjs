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

const base = process.argv[2] || "http://localhost:9000"
const email = loadEnv("LUIGI_ADMIN_EMAIL") || "gmzulia01@gmail.com"
const password = loadEnv("LUIGI_ADMIN_PASSWORD") || loadEnv("TEST_ADMIN_PASSWORD")

const loginRes = await fetch(`${base}/skrepay/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
})

console.log("base", base)
console.log("login", loginRes.status)
if (!loginRes.ok) {
  console.log(await loginRes.text())
  process.exit(1)
}

const { token } = await loginRes.json()
const storesRes = await fetch(`${base}/admin/stores`, {
  headers: { Authorization: `Bearer ${token}` },
})
const storesBody = await storesRes.json()
console.log("GET /admin/stores", storesRes.status)
console.log(JSON.stringify(storesBody, null, 2))

const supported = storesBody.stores?.[0]?.supported_currencies
console.log(
  "\nsupported_currencies count:",
  supported?.length ?? 0,
  supported?.map((c) => c.currency_code).join(", ") || "(empty — UI broken)"
)
