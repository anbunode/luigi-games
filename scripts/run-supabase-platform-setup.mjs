import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const backendRoot = resolve(root, "skrepayshop-api/apps/backend")
const require = createRequire(resolve(backendRoot, "package.json"))
const pg = require("pg")
const envPath = resolve(root, "skrepayshop-api/apps/backend/.env")

function loadDatabaseUrl() {
  const raw = readFileSync(envPath, "utf8")
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith("DATABASE_URL=")) {
      return line.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "")
    }
  }
  throw new Error("DATABASE_URL no encontrada en .env")
}

const tenantsSql = readFileSync(
  resolve(root, "supabase/migrations/20260625120000_skrepayshop_tenants.sql"),
  "utf8"
).replace(
  /insert into public\.skrepayshop_tenants[\s\S]*?updated_at = now\(\);\s*/i,
  ""
)

const urlsSql = readFileSync(
  resolve(root, "supabase/migrations/20260625140000_skrepayshop_urls_and_payment_links.sql"),
  "utf8"
).replace(
  /update public\.skrepayshop_tenants[\s\S]*?where slug = 'luigi-games';\s*/i,
  ""
)

const migrationSql = readFileSync(
  resolve(root, "supabase/migrations/20260626120000_skrepayshop_accounts.sql"),
  "utf8"
)

const cleanupSql = `
do $$
begin
  if to_regclass('public.skrepayshop_verification_code') is not null then
    truncate public.skrepayshop_verification_code;
  end if;
end $$;

delete from public.skrepayshop_payment_links where true;
delete from public.skrepayshop_tenants where true;

do $$
begin
  if to_regclass('public.storefront_theme') is not null then
    delete from public.storefront_theme where true;
  end if;
end $$;

delete from public.provider_identity where true;
delete from public.auth_identity where true;
delete from public."user" where deleted_at is null;
`

const catalogCleanupSql = readFileSync(
  resolve(root, "scripts/sql/cleanup-catalog.sql"),
  "utf8"
)

async function main() {
  const client = new pg.Client({
    connectionString: loadDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  console.log("Conectado a Supabase.")

  try {
    console.log("Creando tablas SkrepayShop...")
    await client.query(tenantsSql)
    await client.query(urlsSql)
    console.log("Ejecutando migración de cuentas...")
    await client.query(migrationSql)
    console.log("Migración OK.")

    console.log("Limpiando datos legacy...")
    await client.query(cleanupSql)
    await client.query(catalogCleanupSql)
    console.log("Limpieza OK.")
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
