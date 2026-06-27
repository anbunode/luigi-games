/**
 * Provisiona Luigi Games: schema + admin aislado.
 * Uso: node scripts/provision-luigi-tenant.mjs
 */
import { readFileSync } from "fs"
import { randomBytes } from "crypto"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"

const slug = "luigi-games"
const schema = "t_luigi_games"
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const backendRoot = resolve(root, "skrepayshop-api/apps/backend")
const pg = createRequire(resolve(backendRoot, "package.json"))("pg")

function loadEnv(name) {
  if (process.env[name]) return process.env[name].trim()
  const raw = readFileSync(resolve(backendRoot, ".env"), "utf8")
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith(`${name}=`)) {
      return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "")
    }
  }
  return ""
}

function newId(prefix) {
  const hex = randomBytes(12).toString("hex")
  return `${prefix}_01${hex.slice(0, 24).toUpperCase()}`
}

const url = loadEnv("DATABASE_URL")
const email = (loadEnv("LUIGI_ADMIN_EMAIL") || "gmzulia01@gmail.com").toLowerCase()
const password = loadEnv("LUIGI_ADMIN_PASSWORD")

const client = new pg.Client({
  connectionString: url,
  ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false },
})

await client.connect()

const tableCount = await client.query(
  `select count(*)::int as c from information_schema.tables where table_schema = $1`,
  [schema]
)

if (tableCount.rows[0].c === 0) {
  console.log("Clonando estructura Medusa a", schema)
  await client.query(`create schema if not exists "${schema}"`)
  const PLATFORM_PREFIX = "skrepayshop_"
  const SKIP = new Set([
    "mikro_orm_migrations",
    "link_module_migrations",
    "script_migrations",
  ])
  const tables = await client.query(
    `select tablename from pg_tables where schemaname='public' and tablename not like $1 order by tablename`,
    [`${PLATFORM_PREFIX}%`]
  )
  for (const { tablename } of tables.rows) {
    if (SKIP.has(tablename)) continue
    await client.query(
      `create table "${schema}"."${tablename}" (like public."${tablename}" including all)`
    )
  }
}

const existing = await client.query(
  `select id from "${schema}"."user" where lower(email)=lower($1) and deleted_at is null limit 1`,
  [email]
)

let userId = existing.rows[0]?.id
let salesChannelId
let authIdentityId

if (!userId) {
  const scryptKdf = createRequire(resolve(backendRoot, "package.json"))("scrypt-kdf")
  let passwordHash

  const source = await client.query(
    `select pi.provider_metadata->>'password' as password_hash
     from public."user" u
     join public.auth_identity ai on (ai.app_metadata->>'user_id') = u.id
     join public.provider_identity pi on pi.auth_identity_id = ai.id
     where lower(u.email)=lower($1) and pi.provider='emailpass' limit 1`,
    [email]
  )

  if (source.rows[0]?.password_hash) {
    passwordHash = source.rows[0].password_hash
    console.log("Copiando hash de auth desde public")
  } else if (password) {
    const buf = await scryptKdf.kdf(password, { logN: 15, r: 8, p: 1 })
    passwordHash = buf.toString("base64")
    console.log("Creando hash nuevo")
  } else {
    throw new Error("Falta LUIGI_ADMIN_PASSWORD o admin en public")
  }

  userId = newId("user")
  authIdentityId = newId("authid")
  const providerId = newId("provid")
  salesChannelId = newId("sc")

  await client.query("begin")
  await client.query(
    `insert into "${schema}"."user" (id, email, first_name, last_name, created_at, updated_at)
     values ($1, $2, 'Luigi Games', '', now(), now())`,
    [userId, email]
  )
  await client.query(
    `insert into "${schema}".auth_identity (id, app_metadata, created_at, updated_at)
     values ($1, $2::jsonb, now(), now())`,
    [authIdentityId, JSON.stringify({ user_id: userId })]
  )
  await client.query(
    `insert into "${schema}".provider_identity (id, entity_id, provider, auth_identity_id, provider_metadata, created_at, updated_at)
     values ($1, $2, 'emailpass', $3, $4::jsonb, now(), now())`,
    [providerId, email, authIdentityId, JSON.stringify({ password: passwordHash })]
  )
  await client.query(
    `insert into "${schema}".sales_channel (id, name, description, is_disabled, created_at, updated_at)
     values ($1, 'Luigi Games', 'Canal SkrepayShop — luigi-games', false, now(), now())`,
    [salesChannelId]
  )
  await client.query("commit")
  console.log("Admin creado en schema tenant")
} else {
  console.log("Admin ya existe en schema tenant:", userId)
  const sc = await client.query(
    `select id from "${schema}".sales_channel where deleted_at is null order by created_at asc limit 1`
  )
  salesChannelId = sc.rows[0]?.id
}

const dbUrl = `${url.split("?")[0]}?options=${encodeURIComponent(`-c search_path=${schema}`)}`

await client.query(
  `update public.skrepayshop_tenants
   set owner_email = $2,
       medusa_user_id = $3,
       medusa_sales_channel_id = coalesce($4, medusa_sales_channel_id),
       database_schema = $5,
       database_url = $6,
       database_status = 'active',
       updated_at = now()
   where slug = $1`,
  [slug, email, userId, salesChannelId, schema, dbUrl]
)

console.log(
  JSON.stringify(
    { ok: true, slug, schema, email, medusa_user_id: userId, salesChannelId },
    null,
    2
  )
)

await client.end()
