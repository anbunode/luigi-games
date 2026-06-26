/**
 * Provisiona una BD dedicada para un tenant SkrepayShop.
 *
 * Uso (fase manual):
 *   1. Crear proyecto o base en Supabase para el tenant
 *   2. node scripts/provision-tenant-database.mjs luigi-games "postgresql://..."
 *
 * El script actualiza skrepayshop_tenants.database_url y database_status.
 * La migración Medusa contra la nueva BD debe ejecutarse aparte:
 *   cd skrepayshop-api/apps/backend && DATABASE_URL=... npx medusa db:migrate
 */

import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const backendRoot = resolve(root, "skrepayshop-api/apps/backend")
const require = createRequire(resolve(backendRoot, "package.json"))
const pg = require("pg")

function loadPlatformDatabaseUrl() {
  const envPath = resolve(backendRoot, ".env")
  const raw = readFileSync(envPath, "utf8")
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith("DATABASE_URL=")) {
      return line.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "")
    }
  }
  throw new Error("DATABASE_URL no encontrada en apps/backend/.env")
}

const slug = process.argv[2]
const tenantDatabaseUrl = process.argv[3]

if (!slug) {
  console.error("Uso: node scripts/provision-tenant-database.mjs <slug> [database_url]")
  process.exit(1)
}

const platformUrl = loadPlatformDatabaseUrl()
const client = new pg.Client({
  connectionString: platformUrl,
  ssl: platformUrl.includes("localhost") ? undefined : { rejectUnauthorized: false },
})

await client.connect()

const row = await client.query(
  `select id, slug, database_status from public.skrepayshop_tenants where slug = $1`,
  [slug]
)

if (!row.rows[0]) {
  console.error(`Tenant no encontrado: ${slug}`)
  process.exit(1)
}

if (!tenantDatabaseUrl) {
  console.log(JSON.stringify(row.rows[0], null, 2))
  console.log("\nPasa la DATABASE_URL dedicada como segundo argumento para registrarla.")
  await client.end()
  process.exit(0)
}

await client.query(
  `update public.skrepayshop_tenants
   set database_url = $2,
       database_status = 'dedicated',
       updated_at = now()
   where slug = $1`,
  [slug, tenantDatabaseUrl]
)

console.log(`Tenant ${slug} actualizado con BD dedicada.`)
console.log("Ejecuta medusa db:migrate contra la nueva DATABASE_URL antes de cortar tráfico.")

await client.end()
