/**
 * Aplica migraciones SQL de plataforma sin borrar datos.
 */
import { readFileSync, readdirSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const backendRoot = resolve(root, "skrepayshop-api/apps/backend")
const require = createRequire(resolve(backendRoot, "package.json"))
const pg = require("pg")

function loadDatabaseUrl() {
  const envPath = resolve(backendRoot, ".env")
  const raw = readFileSync(envPath, "utf8")

  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith("PLATFORM_DATABASE_URL=")) {
      return line.slice("PLATFORM_DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "")
    }
    if (line.startsWith("DATABASE_URL=")) {
      return line.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "")
    }
  }

  throw new Error("DATABASE_URL no encontrada en apps/backend/.env")
}

const migrationsDir = resolve(root, "supabase/migrations")
const files = readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .sort()

const client = new pg.Client({
  connectionString: loadDatabaseUrl(),
  ssl: { rejectUnauthorized: false },
})

await client.connect()
console.log("Aplicando migraciones SQL de plataforma...")

for (const file of files) {
  const sql = readFileSync(resolve(migrationsDir, file), "utf8")
  console.log(`→ ${file}`)
  await client.query(sql)
}

console.log("Migraciones aplicadas.")
await client.end()
