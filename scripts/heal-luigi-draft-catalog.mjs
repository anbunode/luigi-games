/**
 * Alinea catálogo public con tenant luigi-game:
 * - Borradores usan el canal Luigi Game (no Default Sales Channel)
 * - Productos del catálogo enlazados al canal del tenant
 */
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"

const backendRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../skrepayshop-api/apps/backend"
)
const pg = createRequire(resolve(backendRoot, "package.json"))("pg")

function loadEnv(name) {
  const raw = readFileSync(resolve(backendRoot, ".env"), "utf8")
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith(`${name}=`)) {
      return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "")
    }
  }
  return ""
}

const LUIGI_CHANNEL = "sc_01KW637FCVKXSDWJ9S8KSV0WHN"
const LEGACY_DEFAULT_CHANNEL = "sc_01KVVSHG025BRSRSHTA3N81Y7R"

const url = loadEnv("DATABASE_URL")
const client = new pg.Client({
  connectionString: url,
  ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false },
})
await client.connect()

const tenant = await client.query(
  `select slug, medusa_sales_channel_id
   from public.skrepayshop_tenants
   where slug = 'luigi-game'
   limit 1`
)
const channelId = tenant.rows[0]?.medusa_sales_channel_id || LUIGI_CHANNEL
console.log("Using sales channel:", channelId)

const draftUpdate = await client.query(
  `update public."order"
   set sales_channel_id = $1, updated_at = now()
   where deleted_at is null
     and status = 'draft'
     and sales_channel_id = $2`,
  [channelId, LEGACY_DEFAULT_CHANNEL]
)
console.log("Draft orders retargeted:", draftUpdate.rowCount)

const products = await client.query(
  `select id, title
   from public.product
   where deleted_at is null`
)

for (const product of products.rows) {
  const existing = await client.query(
    `select id
     from public.product_sales_channel
     where product_id = $1
       and sales_channel_id = $2
       and deleted_at is null`,
    [product.id, channelId]
  )

  if (existing.rows[0]) {
    continue
  }

  const linkId = `prodsc_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`.slice(0, 31)
  await client.query(
    `insert into public.product_sales_channel
       (id, product_id, sales_channel_id, created_at, updated_at)
     values ($1, $2, $3, now(), now())
     on conflict do nothing`,
    [linkId, product.id, channelId]
  )
  console.log("Linked product to Luigi channel:", product.title)
}

const verify = await client.query(
  `select sales_channel_id, count(*)::int as c
   from public."order"
   where deleted_at is null and status = 'draft'
   group by sales_channel_id`
)
console.log("Draft channels after heal:", verify.rows)

const sourceChannel = await client.query(
  `select id, name, description, is_disabled, metadata, created_at
   from "t_luigi_game".sales_channel
   where id = $1 and deleted_at is null`,
  [channelId]
)

if (sourceChannel.rows[0]) {
  const row = sourceChannel.rows[0]
  const existingChannel = await client.query(
    `select id from public.sales_channel where id = $1`,
    [channelId]
  )

  if (existingChannel.rows[0]) {
    await client.query(
      `update public.sales_channel
       set name = $2, description = $3, is_disabled = $4, metadata = $5, updated_at = now(), deleted_at = null
       where id = $1`,
      [row.id, row.name, row.description, row.is_disabled, row.metadata]
    )
  } else {
    await client.query(
      `insert into public.sales_channel
         (id, name, description, is_disabled, metadata, created_at, updated_at, deleted_at)
       values ($1, $2, $3, $4, $5, $6, now(), null)`,
      [row.id, row.name, row.description, row.is_disabled, row.metadata, row.created_at]
    )
  }
  console.log("Synced sales channel to public:", row.name)
}

await client.end()
console.log("Done.")
