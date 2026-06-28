/**
 * Reinicia la base de datos de SkrepayShop desde cero.
 *
 * - Elimina todos los schemas tenant (t_*)
 * - Elimina tablas de plataforma en public (skrepayshop_*)
 * - Reaplica migraciones de supabase/migrations
 *
 * Uso:
 *   node scripts/reset-ecosystem-database.mjs --confirm
 *
 * Requiere DATABASE_URL en skrepayshop-api/apps/backend/.env
 */
import { readFileSync, readdirSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const backendRoot = resolve(root, "skrepayshop-api/apps/backend")
const migrationsDir = resolve(root, "supabase/migrations")
const require = createRequire(resolve(backendRoot, "package.json"))
const pg = require("pg")

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL.trim()
  }
  const envPath = resolve(backendRoot, ".env")
  const raw = readFileSync(envPath, "utf8")
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith("DATABASE_URL=")) {
      return line.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "")
    }
  }
  throw new Error("DATABASE_URL no encontrada")
}

async function dropTenantSchemas(client) {
  const { rows } = await client.query(`
    select schema_name
    from information_schema.schemata
    where schema_name like 't\\_%' escape '\\'
    order by schema_name
  `)

  for (const { schema_name } of rows) {
    await client.query(`drop schema if exists "${schema_name}" cascade`)
    console.log(`Dropped schema ${schema_name}`)
  }
}

async function dropPlatformTables(client) {
  const tables = [
    "skrepayshop_verification_code",
    "skrepayshop_payment_links",
    "skrepayshop_store_domains",
    "skrepayshop_tenants",
    "scraped_products",
  ]

  for (const table of tables) {
    await client.query(`drop table if exists public.${table} cascade`)
    console.log(`Dropped table public.${table}`)
  }
}

async function applyMigrations(client) {
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort()

  for (const file of files) {
    const sql = readFileSync(resolve(migrationsDir, file), "utf8")
    console.log(`Applying ${file}...`)
    await client.query(sql)
  }
}

async function main() {
  if (!process.argv.includes("--confirm")) {
    console.error(
      "Acción destructiva. Ejecuta con --confirm para borrar todos los datos."
    )
    process.exit(1)
  }

  const client = new pg.Client({
    connectionString: loadDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  console.log("Conectado. Reiniciando ecosistema...")

  try {
    await client.query("begin")
    await dropTenantSchemas(client)
    await dropPlatformTables(client)
    await applyMigrations(client)
    await client.query("commit")
    console.log("\nListo. Base de datos reiniciada.")
    console.log("Siguiente paso: despliega la API y crea una cuenta en skrepay.com/signup")
  } catch (error) {
    await client.query("rollback")
    throw error
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
