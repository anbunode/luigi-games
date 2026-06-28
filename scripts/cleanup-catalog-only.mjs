import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const backendRoot = resolve(root, "skrepayshop-api/apps/backend")
const require = createRequire(resolve(backendRoot, "package.json"))
const pg = require("pg")

function loadDatabaseUrl() {
  const raw = readFileSync(resolve(backendRoot, ".env"), "utf8")
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith("DATABASE_URL=")) {
      return line.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "")
    }
  }
  throw new Error("DATABASE_URL no encontrada")
}

const sql = readFileSync(resolve(root, "scripts/sql/cleanup-catalog.sql"), "utf8")
const client = new pg.Client({
  connectionString: loadDatabaseUrl(),
  ssl: { rejectUnauthorized: false },
})

await client.connect()
await client.query(sql)
await client.end()
console.log("Catálogo legacy eliminado.")
