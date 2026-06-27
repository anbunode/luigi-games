/**
 * Copia admin (user + auth) de public → schema tenant para un email.
 * Uso: node scripts/copy-admin-to-tenant.mjs luigi-games gmzulia01@gmail.com
 */
import { readFileSync } from "fs"
import { randomBytes } from "crypto"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"

const slug = process.argv[2] || "luigi-games"
const email = (process.argv[3] || "gmzulia01@gmail.com").toLowerCase()
const schema = `t_${slug.replace(/[^a-z0-9_]/g, "_")}`
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const backendRoot = resolve(root, "skrepayshop-api/apps/backend")
const pg = createRequire(resolve(backendRoot, "package.json"))("pg")

function loadEnv(name) {
  const raw = readFileSync(resolve(backendRoot, ".env"), "utf8")
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith(`${name}=`)) return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "")
  }
  return ""
}

function newId(prefix) {
  return `${prefix}_${randomBytes(16).toString("hex")}`
}

const url = loadEnv("DATABASE_URL")
const client = new pg.Client({
  connectionString: url,
  ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false },
})

await client.connect()

const source = await client.query(
  `select u.id as user_id, u.email, u.first_name, u.last_name,
          ai.id as auth_identity_id,
          pi.id as provider_identity_id, pi.provider_metadata, pi.provider, pi.entity_id
   from public."user" u
   join public.auth_identity ai on (ai.app_metadata->>'user_id') = u.id
   join public.provider_identity pi on pi.auth_identity_id = ai.id
   where lower(u.email) = lower($1) and u.deleted_at is null
   limit 1`,
  [email]
)

if (!source.rows[0]) {
  console.error(`No hay admin en public con email ${email}. Ejecuta bootstrap cuando el schema esté listo.`)
  process.exit(1)
}

const row = source.rows[0]
const newUserId = newId("user")
const newAuthId = newId("authid")
const newProviderId = newId("provid")

await client.query("begin")

await client.query(
  `insert into "${schema}"."user" (id, email, first_name, last_name, created_at, updated_at)
   select $1, email, first_name, last_name, now(), now() from public."user" where id = $2`,
  [newUserId, row.user_id]
)

await client.query(
  `insert into "${schema}".auth_identity (id, app_metadata, created_at, updated_at)
   values ($1, jsonb_build_object('user_id', $2), now(), now())`,
  [newAuthId, newUserId]
)

await client.query(
  `insert into "${schema}".provider_identity (
     id, entity_id, provider, auth_identity_id, provider_metadata, created_at, updated_at
   )
   select $1, $2, provider, $3, provider_metadata, now(), now()
   from public.provider_identity where id = $4`,
  [newProviderId, email, newAuthId, row.provider_identity_id]
)

let salesChannelId = (
  await client.query(
    `select id from "${schema}".sales_channel where deleted_at is null order by created_at asc limit 1`
  )
).rows[0]?.id

if (!salesChannelId) {
  salesChannelId = newId("sc")
  await client.query(
    `insert into "${schema}".sales_channel (id, name, description, is_disabled, created_at, updated_at)
     values ($1, 'Luigi Games', 'Canal SkrepayShop — luigi-games', false, now(), now())`,
    [salesChannelId]
  )
}

await client.query(
  `update public.skrepayshop_tenants
   set owner_email = $2,
       medusa_user_id = $3,
       medusa_sales_channel_id = $4,
       database_schema = $5,
       database_status = 'active',
       updated_at = now()
   where slug = $1`,
  [slug, email, newUserId, salesChannelId, schema]
)

await client.query("commit")

console.log(
  JSON.stringify(
    {
      ok: true,
      slug,
      schema,
      email,
      medusa_user_id: newUserId,
      medusa_sales_channel_id: salesChannelId,
    },
    null,
    2
  )
)

await client.end()
