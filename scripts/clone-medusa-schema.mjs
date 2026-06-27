/**
 * Clona estructura Medusa de public → t_{slug} (sin datos).
 * Uso: node scripts/clone-medusa-schema.mjs luigi-games
 */
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const backendRoot = resolve(root, "skrepayshop-api/apps/backend")
const require = createRequire(resolve(backendRoot, "package.json"))
const pg = require("pg")

const slug = process.argv[2] || "luigi-games"
const schema = `t_${slug.replace(/[^a-z0-9_]/g, "_")}`

function loadDatabaseUrl() {
  const raw = readFileSync(resolve(backendRoot, ".env"), "utf8")
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith("DATABASE_URL=")) {
      return line.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "")
    }
  }
  throw new Error("DATABASE_URL missing")
}

const PLATFORM_PREFIX = "skrepayshop_"
const SKIP = new Set([
  "mikro_orm_migrations",
  "link_module_migrations",
  "script_migrations",
])

const url = loadDatabaseUrl()
const client = new pg.Client({
  connectionString: url,
  ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false },
})

await client.connect()
await client.query(`drop schema if exists "${schema}" cascade`)
await client.query(`create schema "${schema}"`)

const tables = await client.query(
  `select tablename from pg_tables where schemaname = 'public' and tablename not like $1 order by tablename`,
  [`${PLATFORM_PREFIX}%`]
)

let count = 0
for (const { tablename } of tables.rows) {
  if (SKIP.has(tablename)) continue
  await client.query(
    `create table "${schema}"."${tablename}" (like public."${tablename}" including all)`
  )
  count += 1
}

console.log(JSON.stringify({ slug, schema, tablesCloned: count }))
await client.end()
