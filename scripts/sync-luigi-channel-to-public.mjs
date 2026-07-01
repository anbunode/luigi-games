/**
 * Copia el canal Luigi Game al schema public para que los joins de Medusa
 * (orders en public + sales_channel) funcionen en la UI de borradores.
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

const CHANNEL_ID = "sc_01KW637FCVKXSDWJ9S8KSV0WHN"

const url = loadEnv("DATABASE_URL")
const client = new pg.Client({
  connectionString: url,
  ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false },
})
await client.connect()

const source = await client.query(
  `select id, name, description, is_disabled, metadata, created_at, updated_at, deleted_at
   from "t_luigi_game".sales_channel
   where id = $1 and deleted_at is null`,
  [CHANNEL_ID]
)

if (!source.rows[0]) {
  throw new Error("Luigi channel not found in tenant schema")
}

const row = source.rows[0]
const existing = await client.query(
  `select id from public.sales_channel where id = $1`,
  [CHANNEL_ID]
)

if (existing.rows[0]) {
  await client.query(
    `update public.sales_channel
     set name = $2,
         description = $3,
         is_disabled = $4,
         metadata = $5,
         updated_at = now(),
         deleted_at = null
     where id = $1`,
    [row.id, row.name, row.description, row.is_disabled, row.metadata]
  )
  console.log("Updated public sales channel:", row.name)
} else {
  await client.query(
    `insert into public.sales_channel
       (id, name, description, is_disabled, metadata, created_at, updated_at, deleted_at)
     values ($1, $2, $3, $4, $5, $6, now(), null)`,
    [
      row.id,
      row.name,
      row.description,
      row.is_disabled,
      row.metadata,
      row.created_at,
    ]
  )
  console.log("Inserted public sales channel:", row.name)
}

const verify = await client.query(
  `select id, name from public.sales_channel where id = $1`,
  [CHANNEL_ID]
)
console.log("public channel:", verify.rows[0])

await client.end()
