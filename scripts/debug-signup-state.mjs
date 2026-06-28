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
    const codes = await client.query(
      `select email, purpose, consumed_at, expires_at, left(code_hash, 12) as hash_prefix, payload
       from skrepayshop_verification_code
       order by created_at desc limit 5`
    )
    const auth = await client.query(
      `select ai.id, pi.entity_id, pi.provider_metadata
       from auth_identity ai
       left join provider_identity pi on pi.auth_identity_id = ai.id`
    )
    console.log("=== verification codes ===")
    console.table(codes.rows)
    console.log("=== auth ===")
    console.table(auth.rows)
  } finally {
    await client.end()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
