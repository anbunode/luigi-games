/**
 * Fix draft convert: inventory levels must reference stock locations visible
 * in public schema; remove duplicate variant→inventory links; align store default.
 */
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../skrepayshop-api/apps/backend")
const pg = createRequire(resolve(backendRoot, "package.json"))("pg")

function loadEnv(n) {
  const r = readFileSync(resolve(backendRoot, ".env"), "utf8")
  for (const l of r.split(/\r?\n/)) {
    if (l.startsWith(n + "=")) return l.slice(n.length + 1).trim().replace(/^["']|["']$/g, "")
  }
  return ""
}

const TENANT = "t_luigi_game"
const STORE_ID = "store_01KW637FN4S603BBGDRGD5YNWM"
const SALES_CHANNEL = "sc_01KW637FCVKXSDWJ9S8KSV0WHN"

const client = new pg.Client({ connectionString: loadEnv("DATABASE_URL"), ssl: { rejectUnauthorized: false } })
await client.connect()

async function q(sql, params = []) {
  return client.query(sql, params)
}

// 1. Pick primary public location (European Warehouse or first public)
const pubLocs = await q(`select id, name from public.stock_location where deleted_at is null order by created_at`)
const primaryPublicLoc = pubLocs.rows.find((r) => r.name === "European Warehouse")?.id ?? pubLocs.rows[0]?.id
console.log("primary public location:", primaryPublicLoc, pubLocs.rows.map((r) => r.name))

// 2. Mirror tenant Luigi location into public if missing
const tenantLoc = await q(
  `select sl.id, sl.name, sla.address_1, sla.city, sla.country_code, sla.province, sla.postal_code
   from ${TENANT}.stock_location sl
   left join ${TENANT}.stock_location_address sla on sla.id = sl.address_id
   where sl.deleted_at is null limit 1`
)
const tl = tenantLoc.rows[0]
if (tl) {
  const exists = await q(`select id from public.stock_location where id = $1`, [tl.id])
  if (!exists.rows[0]) {
    let addressId = null
    if (tl.address_1 || tl.city) {
      addressId = `laddr_${tl.id.slice(5)}`
      await q(
        `insert into public.stock_location_address (id, address_1, city, country_code, province, postal_code, created_at, updated_at)
         values ($1,$2,$3,$4,$5,$6,now(),now()) on conflict (id) do nothing`,
        [addressId, tl.address_1, tl.city, tl.country_code, tl.province, tl.postal_code]
      )
    }
    await q(
      `insert into public.stock_location (id, name, address_id, created_at, updated_at)
       values ($1,$2,$3,now(),now()) on conflict (id) do nothing`,
      [tl.id, tl.name, addressId]
    )
    console.log("mirrored tenant location to public:", tl.id, tl.name)
  }
}

const defaultLoc = tl?.id && (await q(`select id from public.stock_location where id=$1`, [tl.id])).rows[0]
  ? tl.id
  : primaryPublicLoc

// 3. Set store default to a public-visible location
await q(
  `update ${TENANT}.store set default_location_id = $2, updated_at = now() where id = $1`,
  [STORE_ID, defaultLoc]
)
console.log("store default_location_id ->", defaultLoc)

// 4. Link sales channel to default location in both schemas
for (const schema of ["public", TENANT]) {
  const schemaQ = `"${schema}"`
  const link = await q(
    `select id from ${schemaQ}.sales_channel_stock_location
     where sales_channel_id = $1 and stock_location_id = $2 and deleted_at is null`,
    [SALES_CHANNEL, defaultLoc]
  )
  if (!link.rows[0]) {
    const id = `scsl_${Date.now()}${Math.random().toString(36).slice(2, 8)}`
    await q(
      `insert into ${schemaQ}.sales_channel_stock_location (id, sales_channel_id, stock_location_id, created_at, updated_at)
       values ($1,$2,$3,now(),now())`,
      [id, SALES_CHANNEL, defaultLoc]
    )
    console.log(`linked sales channel to location in ${schema}`)
  }
}

// 5. Remove duplicate inventory links (keep one with most stock)
const dupes = await q(
  `select pvii.variant_id, count(*)::int as c
   from public.product_variant_inventory_item pvii
   where pvii.deleted_at is null
   group by pvii.variant_id having count(*) > 1`
)
let removedLinks = 0
for (const row of dupes.rows) {
  const links = await q(
    `select pvii.id, pvii.inventory_item_id,
            coalesce((select sum(stocked_quantity::int) from public.inventory_level il
                      where il.inventory_item_id = pvii.inventory_item_id and il.deleted_at is null), 0) as stock
     from public.product_variant_inventory_item pvii
     where pvii.variant_id = $1 and pvii.deleted_at is null
     order by stock desc, pvii.created_at asc`,
    [row.variant_id]
  )
  const keep = links.rows[0]
  for (const link of links.rows.slice(1)) {
    await q(`update public.product_variant_inventory_item set deleted_at = now() where id = $1`, [link.id])
    removedLinks++
    console.log("removed duplicate link", row.variant_id, link.inventory_item_id, "kept", keep.inventory_item_id)
  }
}

// 6. Ensure every inventory item used by catalog has stock at defaultLoc
const items = await q(
  `select distinct pvii.inventory_item_id
   from public.product_variant_inventory_item pvii
   where pvii.deleted_at is null`
)
let levelsAdded = 0
for (const { inventory_item_id } of items.rows) {
  const level = await q(
    `select id from public.inventory_level
     where inventory_item_id = $1 and location_id = $2 and deleted_at is null`,
    [inventory_item_id, defaultLoc]
  )
  if (!level.rows[0]) {
    const id = `ilev_${Date.now()}${Math.random().toString(36).slice(2, 10)}`
    await q(
      `insert into public.inventory_level (
         id, inventory_item_id, location_id, stocked_quantity, reserved_quantity, incoming_quantity,
         raw_stocked_quantity, raw_reserved_quantity, raw_incoming_quantity, created_at, updated_at
       ) values ($1,$2,$3,10,0,0,'{"value":"10","precision":20}'::jsonb,'{"value":"0","precision":20}'::jsonb,'{"value":"0","precision":20}'::jsonb,now(),now())`,
      [id, inventory_item_id, defaultLoc]
    )
    levelsAdded++
  }
}

console.log("\nDone:", { defaultLoc, removedLinks, levelsAdded, duplicateVariants: dupes.rows.length })
await client.end()
