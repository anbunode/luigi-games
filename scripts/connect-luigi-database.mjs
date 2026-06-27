/**
 * Provisiona Luigi Games en el MISMO Supabase (schema t_luigi_games).
 * Sin proyectos extra, sin Render extra, sin pasos manuales por cliente.
 *
 * Uso:
 *   node scripts/connect-luigi-database.mjs
 *   node scripts/connect-luigi-database.mjs --bootstrap   # crea admin si falta
 *
 * Opcional en .env:
 *   LUIGI_ADMIN_EMAIL=...
 *   LUIGI_ADMIN_PASSWORD=...   (solo con --bootstrap)
 */

import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { spawn } from "child_process"
import { createRequire } from "module"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const backendRoot = resolve(root, "skrepayshop-api/apps/backend")
const require = createRequire(resolve(backendRoot, "package.json"))
const pg = require("pg")

const slug = "luigi-games"
const forceBootstrap = process.argv.includes("--bootstrap")

function loadEnvValue(name) {
  if (process.env[name]) {
    return process.env[name].trim()
  }

  const envPath = resolve(backendRoot, ".env")
  const raw = readFileSync(envPath, "utf8")

  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith(`${name}=`)) {
      return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "")
    }
  }

  return ""
}

function tenantSchemaName(value) {
  return `t_${value.replace(/[^a-z0-9_]/g, "_")}`
}

function withSearchPath(connectionString, schema) {
  const option = encodeURIComponent(`-c search_path=${schema}`)
  const separator = connectionString.includes("?") ? "&" : "?"
  return `${connectionString}${separator}options=${option}`
}

function runMedusa(databaseUrl, medusaArgs, extraEnv = {}) {
  const schemaMatch = databaseUrl.match(/search_path(?:%3D|=)([^&%]+)/i)
  const schema = schemaMatch?.[1]

  return new Promise((resolveRun, rejectRun) => {
    const child = spawn("npx", ["medusa", ...medusaArgs], {
      cwd: backendRoot,
      shell: true,
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        ...(schema ? { PGOPTIONS: `-c search_path=${schema}` } : {}),
        ...extraEnv,
      },
      stdio: "inherit",
    })

    child.on("error", rejectRun)
    child.on("close", (code) => {
      if (code === 0) {
        resolveRun()
        return
      }

      rejectRun(new Error(`medusa ${medusaArgs.join(" ")} falló (${code})`))
    })
  })
}

function parseJsonLine(stdout) {
  const lines = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index]
    if (!line.startsWith("{")) continue

    try {
      return JSON.parse(line)
    } catch {
      continue
    }
  }

  throw new Error("No se recibió JSON del bootstrap.")
}

async function bootstrapTenant(databaseUrl, tenant) {
  const email =
    process.env.LUIGI_ADMIN_EMAIL ||
    loadEnvValue("LUIGI_ADMIN_EMAIL") ||
    tenant.owner_email
  const password =
    process.env.LUIGI_ADMIN_PASSWORD || loadEnvValue("LUIGI_ADMIN_PASSWORD")

  if (!email) {
    throw new Error(
      "Define owner_email en skrepayshop_tenants o LUIGI_ADMIN_EMAIL en .env"
    )
  }

  if (!password) {
    throw new Error("Define LUIGI_ADMIN_PASSWORD en .env para --bootstrap")
  }

  const child = spawn(
    "npx",
    ["medusa", "exec", "./src/scripts/tenant-bootstrap.ts"],
    {
      cwd: backendRoot,
      shell: true,
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl.split("?")[0],
        PGOPTIONS: `-c search_path=${schema}`,
        TENANT_BOOTSTRAP_EMAIL: email,
        TENANT_BOOTSTRAP_PASSWORD: password,
        TENANT_BOOTSTRAP_SHOP_NAME: tenant.display_name || "Luigi Games",
        TENANT_BOOTSTRAP_SLUG: slug,
      TENANT_BOOTSTRAP_SCHEMA: schema,
      },
      stdio: ["ignore", "pipe", "pipe"],
    }
  )

  let stdout = ""
  let stderr = ""

  child.stdout?.on("data", (chunk) => {
    stdout += chunk.toString()
  })

  child.stderr?.on("data", (chunk) => {
    stderr += chunk.toString()
  })

  await new Promise((resolveRun, rejectRun) => {
    child.on("close", (code) => {
      if (code === 0) {
        resolveRun()
        return
      }

      const output = `${stderr}\n${stdout}`
      if (output.includes("Identity with email already exists")) {
        resolveRun()
        return
      }

      rejectRun(new Error(stderr || stdout || `bootstrap falló (${code})`))
    })
  })

  if (stdout.includes("medusa_user_id")) {
    return parseJsonLine(stdout)
  }

  return linkExistingAdmin(databaseUrl, email)
}

async function linkExistingAdmin(databaseUrl, email) {
  const client = new pg.Client({
    connectionString: databaseUrl.split("?")[0],
    ssl: databaseUrl.includes("localhost") ? undefined : { rejectUnauthorized: false },
  })

  await client.connect()
  await client.query(`set search_path to "${schema}", public`)

  const userRow = await client.query(
    `select id from "user" where lower(email) = lower($1) and deleted_at is null limit 1`,
    [email]
  )
  const channelRow = await client.query(
    `select id from sales_channel where deleted_at is null order by created_at asc limit 1`
  )

  await client.end()

  const medusaUserId = userRow.rows[0]?.id
  const salesChannelId = channelRow.rows[0]?.id

  if (!medusaUserId) {
    throw new Error(`No hay admin con email ${email} en ${schema}`)
  }

  return {
    medusa_user_id: medusaUserId,
    medusa_sales_channel_id: salesChannelId,
  }
}

const platformUrl =
  loadEnvValue("PLATFORM_DATABASE_URL") || loadEnvValue("DATABASE_URL")

if (!platformUrl) {
  console.error("Falta DATABASE_URL en apps/backend/.env")
  process.exit(1)
}

const schema = tenantSchemaName(slug)
const tenantDatabaseUrl = withSearchPath(platformUrl, schema)

const client = new pg.Client({
  connectionString: platformUrl,
  ssl: platformUrl.includes("localhost") ? undefined : { rejectUnauthorized: false },
})

await client.connect()

console.log(`Recreando schema ${schema} clonando estructura Medusa...`)
await client.query(`drop schema if exists "${schema}" cascade`)
await client.query(`create schema "${schema}"`)

const PLATFORM_PREFIX = "skrepayshop_"
const SKIP = new Set([
  "mikro_orm_migrations",
  "link_module_migrations",
  "script_migrations",
])
const tableRows = await client.query(
  `select tablename from pg_tables where schemaname = 'public' and tablename not like $1 order by tablename`,
  [`${PLATFORM_PREFIX}%`]
)

let cloned = 0
for (const { tablename } of tableRows.rows) {
  if (SKIP.has(tablename)) continue
  await client.query(
    `create table "${schema}"."${tablename}" (like public."${tablename}" including all)`
  )
  cloned += 1
}
console.log(`Tablas clonadas en ${schema}: ${cloned}`)

const tenantResult = await client.query(
  `select id, slug, display_name, owner_email, medusa_user_id, medusa_sales_channel_id,
          database_url, database_schema, database_status
   from public.skrepayshop_tenants
   where slug = $1`,
  [slug]
)

let tenant = tenantResult.rows[0]

if (!tenant) {
  console.log("Registrando tenant luigi-games en plataforma...")
  await client.query(
    `insert into public.skrepayshop_tenants (slug, display_name, plan, status)
     values ($1, 'Luigi Games', 'starter', 'active')
     on conflict (slug) do nothing`,
    [slug]
  )

  const inserted = await client.query(
    `select id, slug, display_name, owner_email, medusa_user_id, medusa_sales_channel_id,
            database_url, database_schema, database_status
     from public.skrepayshop_tenants where slug = $1`,
    [slug]
  )
  tenant = inserted.rows[0]
}

let medusaUserId = tenant.medusa_user_id
let salesChannelId = tenant.medusa_sales_channel_id

if (forceBootstrap) {
  console.log("Creando admin inicial en schema Luigi...")
  const bootstrapped = await bootstrapTenant(tenantDatabaseUrl, tenant)
  medusaUserId = bootstrapped.medusa_user_id
  salesChannelId = bootstrapped.medusa_sales_channel_id
} else if (!medusaUserId) {
  console.log(
    "Schema migrado. Ejecuta con --bootstrap y LUIGI_ADMIN_EMAIL/LUIGI_ADMIN_PASSWORD para crear el admin."
  )
}

const ownerEmail =
  process.env.LUIGI_ADMIN_EMAIL ||
  loadEnvValue("LUIGI_ADMIN_EMAIL") ||
  tenant.owner_email

if (ownerEmail) {
  await client.query(
    `update public.skrepayshop_tenants
     set owner_email = null
     where lower(owner_email) = lower($1) and slug <> $2`,
    [ownerEmail, slug]
  )
}

await client.query(
  `update public.skrepayshop_tenants
   set database_url = $2,
       database_schema = $3,
       database_status = 'active',
       owner_email = coalesce($6, owner_email),
       medusa_user_id = coalesce($4, medusa_user_id),
       medusa_sales_channel_id = coalesce($5, medusa_sales_channel_id),
       updated_at = now()
   where slug = $1`,
  [
    slug,
    tenantDatabaseUrl,
    schema,
    medusaUserId,
    salesChannelId,
    forceBootstrap ? ownerEmail : null,
  ]
)

console.log(`Luigi Games listo en schema ${schema} (misma Supabase, misma API Render).`)

if (!tenant.owner_email && !loadEnvValue("LUIGI_ADMIN_EMAIL")) {
  console.log(
    "Tip: asigna owner_email al tenant para que el login del lobby resuelva su schema."
  )
}

await client.end()
