import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"
import { randomBytes } from "crypto"

const schema = "t_luigi_game"
const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../skrepayshop-api/apps/backend")
const pg = createRequire(resolve(backendRoot, "package.json"))("pg")

function loadEnv(name) {
  const raw = readFileSync(resolve(backendRoot, ".env"), "utf8")
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith(`${name}=`)) return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "")
  }
  return ""
}

function newId(prefix) {
  return `${prefix}_${randomBytes(12).toString("hex").slice(0, 26).toUpperCase()}`
}

const url = loadEnv("DATABASE_URL")
const client = new pg.Client({
  connectionString: url,
  ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false },
})
await client.connect()

await client.query(
  `update public.price_preference set deleted_at = now(), updated_at = now() where deleted_at is null`
)

const store = await client.query(
  `select id from "${schema}".store where deleted_at is null limit 1`
)
const storeId = store.rows[0]?.id

if (storeId) {
  const pref = await client.query(
    `select id from "${schema}".price_preference
     where deleted_at is null and attribute = 'currency_code' and lower(value) = 'usd'`
  )
  if (!pref.rows[0]) {
    await client.query(
      `insert into "${schema}".price_preference
         (id, attribute, value, is_tax_inclusive, created_at, updated_at)
       values ($1, 'currency_code', 'usd', false, now(), now())`,
      [newId("ppref")]
    )
  }
}

console.log("public price_preferences cleared, tenant USD preference ensured")
await client.end()
