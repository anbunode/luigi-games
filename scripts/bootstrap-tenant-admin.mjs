/**
 * Bootstrap admin en schema tenant usando ALTER ROLE search_path temporal.
 */
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { spawn } from "child_process"
import { createRequire } from "module"

const slug = process.argv[2] || "luigi-games"
const schema = `t_${slug.replace(/[^a-z0-9_]/g, "_")}`
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const backendRoot = resolve(root, "skrepayshop-api/apps/backend")
const pg = createRequire(resolve(backendRoot, "package.json"))("pg")

function loadEnv(name) {
  if (process.env[name]) return process.env[name].trim()
  const raw = readFileSync(resolve(backendRoot, ".env"), "utf8")
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith(`${name}=`)) return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "")
  }
  return ""
}

const url = loadEnv("DATABASE_URL")
const email = loadEnv("LUIGI_ADMIN_EMAIL")
const password = loadEnv("LUIGI_ADMIN_PASSWORD")
const dbUser = decodeURIComponent((url.match(/\/\/([^:]+):/) || [])[1] || "postgres")

function parseJson(text) {
  for (const line of text.split(/\r?\n/).reverse()) {
    if (!line.trim().startsWith("{")) continue
    try { return JSON.parse(line.trim()) } catch { /* continue */ }
  }
  return null
}

const client = new pg.Client({
  connectionString: url,
  ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false },
})

await client.connect()

try {
  await client.query(`alter role "${dbUser}" set search_path to "${schema}"`)
  console.log(`search_path temporal → ${schema} (role ${dbUser})`)

  const result = await new Promise((resolveRun, rejectRun) => {
    const child = spawn("npx", ["medusa", "exec", "./src/scripts/tenant-bootstrap.ts"], {
      cwd: backendRoot,
      shell: true,
      env: {
        ...process.env,
        DATABASE_URL: url.split("?")[0],
        TENANT_BOOTSTRAP_EMAIL: email,
        TENANT_BOOTSTRAP_PASSWORD: password,
        TENANT_BOOTSTRAP_SHOP_NAME: "Luigi Games",
        TENANT_BOOTSTRAP_SLUG: slug,
      },
      stdio: ["ignore", "pipe", "pipe"],
    })
    let out = ""
    let err = ""
    child.stdout?.on("data", (c) => { out += c })
    child.stderr?.on("data", (c) => { err += c })
    child.on("close", (code) => resolveRun({ code, out, err }))
    child.on("error", rejectRun)
  })

  const payload = parseJson(`${result.out}\n${result.err}`)

  if (!payload?.medusa_user_id) {
    console.error(result.err.slice(-1000))
    console.error(result.out.slice(-1000))
    throw new Error("Bootstrap sin salida JSON")
  }

  await client.query(
    `update public.skrepayshop_tenants
     set owner_email = $2,
         medusa_user_id = $3,
         medusa_sales_channel_id = $4,
         database_schema = $5,
         database_status = 'active',
         updated_at = now()
     where slug = $1`,
    [slug, email, payload.medusa_user_id, payload.medusa_sales_channel_id, schema]
  )

  console.log(JSON.stringify({ ok: true, ...payload, schema, email }, null, 2))
} finally {
  await client.query(`alter role "${dbUser}" reset search_path`)
  await client.end()
}
