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
    const auth = await client.query(
      `select ai.id, ai.app_metadata, pi.entity_id
       from auth_identity ai
       left join provider_identity pi on pi.auth_identity_id = ai.id`
    )
    console.table(auth.rows)
  } finally {
    await client.end()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
