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

const CHANNEL = "sc_01KW637FCVKXSDWJ9S8KSV0WHN"
const client = new pg.Client({ connectionString: loadEnv("DATABASE_URL"), ssl: { rejectUnauthorized: false } })
await client.connect()

const r = await client.query(
  `update public."order"
   set sales_channel_id = $1, updated_at = now()
   where status = 'draft' and deleted_at is null
     and (sales_channel_id is null or sales_channel_id <> $1)
   returning id`,
  [CHANNEL]
)
console.log("retargeted drafts:", r.rowCount, r.rows.map((x) => x.id))
await client.end()
