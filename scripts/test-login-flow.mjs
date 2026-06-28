import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const backendRoot = resolve(root, "skrepayshop-api/apps/backend")
const require = createRequire(resolve(backendRoot, "package.json"))
const pg = require("pg")
const envPath = resolve(backendRoot, ".env")

function loadDatabaseUrl() {
  const raw = readFileSync(envPath, "utf8")
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith("DATABASE_URL=")) {
      return line.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "")
    }
  }
  throw new Error("DATABASE_URL no encontrada en .env")
}

async function main() {
  const base = "https://skrepayshop-api.onrender.com"
  const client = new pg.Client({
    connectionString: loadDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
  })
  await client.connect()

  const row = await client.query(
    `select payload from skrepayshop_verification_code
     where lower(email)=lower($1) and purpose='signup'
     order by created_at desc limit 1`,
    ["gmzulia01@gmail.com"]
  )
  await client.end()

  const password = row.rows[0]?.payload?.password
  if (!password) {
    console.log("NO_PASSWORD")
    process.exit(1)
  }

  const authRes = await fetch(`${base}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "gmzulia01@gmail.com", password }),
  })
  const authData = await authRes.json()
  const bridgeRes = await fetch(
    `${base}/skrepay/session-bridge?token=${encodeURIComponent(authData.token)}`,
    { redirect: "manual" }
  )
  console.log("bridge status", bridgeRes.status)
  console.log("bridge location", bridgeRes.headers.get("location"))
  const cookies = bridgeRes.headers.getSetCookie?.() || []
  console.log("bridge cookies count", cookies.length)
  if (cookies[0]) {
    console.log("cookie prefix", cookies[0].slice(0, 40))
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
