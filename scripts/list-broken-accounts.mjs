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
  const client = new pg.Client({
    connectionString: loadDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
  })
  await client.connect()

  try {
    const tenants = await client.query(
      `select slug, owner_email, medusa_user_id, created_at
       from skrepayshop_tenants
       order by created_at desc`
    )
    const users = await client.query(
      `select id, email, created_at from public."user" where deleted_at is null order by created_at desc`
    )
    const auth = await client.query(
      `select ai.id, pi.provider_metadata->>'email' as email
       from auth_identity ai
       join provider_identity pi on pi.auth_identity_id = ai.id`
    )

    console.log("=== Tenants ===")
    console.table(tenants.rows)
    console.log("=== Users ===")
    console.table(users.rows)
    console.log("=== Auth identities ===")
    console.table(auth.rows)
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
