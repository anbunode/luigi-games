/**
 * Verifica y enlaza el tenant Luigi con su admin en t_luigi_games.
 */
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const backendRoot = resolve(root, "skrepayshop-api/apps/backend")
const require = createRequire(resolve(backendRoot, "package.json"))
const pg = require("pg")

const slug = "luigi-games"
const schema = "t_luigi_games"

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

const platformUrl =
  loadEnvValue("PLATFORM_DATABASE_URL") || loadEnvValue("DATABASE_URL")
const email =
  process.env.LUIGI_ADMIN_EMAIL ||
  loadEnvValue("LUIGI_ADMIN_EMAIL") ||
  "gmzulia01@gmail.com"

const client = new pg.Client({
  connectionString: platformUrl,
  ssl: platformUrl.includes("localhost") ? undefined : { rejectUnauthorized: false },
})

await client.connect()

const tables = await client.query(
  `select count(*)::int as count
   from information_schema.tables
   where table_schema = $1`,
  [schema]
)

const userRow = await client.query(
  `select id, email from "${schema}"."user"
   where lower(email) = lower($1) and deleted_at is null
   limit 1`,
  [email]
)

const channelRow = await client.query(
  `select id from "${schema}".sales_channel
   where deleted_at is null
   order by created_at asc
   limit 1`
)

const userId = userRow.rows[0]?.id ?? null
const salesChannelId = channelRow.rows[0]?.id ?? null

await client.query(
  `update public.skrepayshop_tenants
   set owner_email = $2,
       database_schema = $3,
       database_status = 'active',
       medusa_user_id = coalesce($4, medusa_user_id),
       medusa_sales_channel_id = coalesce($5, medusa_sales_channel_id),
       updated_at = now()
   where slug = $1`,
  [slug, email, schema, userId, salesChannelId]
)

const tenant = await client.query(
  `select slug, owner_email, database_schema, database_status, medusa_user_id
   from public.skrepayshop_tenants where slug = $1`,
  [slug]
)

console.log(
  JSON.stringify(
    {
      schema,
      tablesInSchema: tables.rows[0]?.count ?? 0,
      adminEmail: email,
      adminLinked: Boolean(userId),
      medusaUserId: userId,
      salesChannelId,
      tenant: tenant.rows[0],
    },
    null,
    2
  )
)

await client.end()
