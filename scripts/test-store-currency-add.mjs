/**
 * Prueba añadir moneda a la tienda vía POST /admin/stores/:id
 */
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"

const backendRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../skrepayshop-api/apps/backend"
)
const pg = createRequire(resolve(backendRoot, "package.json"))("pg")

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

const bridgeRes = await fetch(
  `${base}/skrepay/session-bridge?token=${encodeURIComponent(token)}`,
  { redirect: "manual" }
)
const cookies = bridgeRes.headers.getSetCookie?.() ?? []
const cookieHeader = cookies.map((c) => c.split(";")[0]).join("; ")

const storesRes = await fetch(`${base}/admin/stores`, {
  headers: { Cookie: cookieHeader },
})
const storesBody = await storesRes.json()
const store = storesBody.stores?.[0]
console.log("GET stores currencies:", store?.supported_currencies?.map((c) => c.currency_code))

const postBody = {
  supported_currencies: [
    { currency_code: "usd", is_default: true },
    { currency_code: "eur", is_default: false },
  ],
}

const postRes = await fetch(`${base}/admin/stores/${store.id}`, {
  method: "POST",
  headers: { Cookie: cookieHeader, "Content-Type": "application/json" },
  body: JSON.stringify(postBody),
})
const postText = await postRes.text()
console.log("POST stores status:", postRes.status)
console.log("POST response currencies:", JSON.parse(postText).store?.supported_currencies?.map((c) => c.currency_code))

const storesRes2 = await fetch(`${base}/admin/stores/${store.id}`, {
  headers: { Cookie: cookieHeader },
})
const store2 = (await storesRes2.json()).store
console.log("GET store after POST:", store2?.supported_currencies?.map((c) => c.currency_code))

const url = loadEnv("DATABASE_URL")
const client = new pg.Client({
  connectionString: url,
  ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false },
})
await client.connect()
const dbRows = await client.query(
  `select currency_code, is_default, deleted_at is null as active
   from "t_luigi_game".store_currency
   where store_id = $1
   order by currency_code`,
  [store.id]
)
console.log("DB store_currency:", dbRows.rows)
await client.end()
