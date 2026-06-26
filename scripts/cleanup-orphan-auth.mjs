import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const backendRoot = resolve(root, "skrepayshop-api/apps/backend")
const require = createRequire(resolve(backendRoot, "package.json"))
const pg = require("pg")
const envPath = resolve(backendRoot, ".env")

function loadDatabaseUrl() {
  const raw = readFileSync(envPath, "utf8")
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith("DATABASE_URL=")) {
      return line.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "")
    }
  }
  throw new Error("DATABASE_URL no encontrada en .env")
}

async function main() {
  const client = new pg.Client({
    connectionString: loadDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
  })
  await client.connect()
  try {
    const orphans = await client.query(`select id from auth_identity`)
    const ids = orphans.rows.map((r) => r.id)
    if (ids.length) {
      await client.query(`delete from provider_identity where auth_identity_id = any($1::text[])`, [ids])
      await client.query(`delete from auth_identity where id = any($1::text[])`, [ids])
      console.log(`Auth huérfanas eliminadas: ${ids.length}`)
    }

    const channels = await client.query(
      `select id, name from sales_channel where name ilike '%luigi%' or description ilike '%luigi-game-store%'`
    )
    if (channels.rowCount) {
      console.log("Sales channels huérfanos:", channels.rows)
      for (const ch of channels.rows) {
        await client.query(`delete from sales_channel where id = $1`, [ch.id])
      }
      console.log(`Sales channels eliminados: ${channels.rowCount}`)
    }
  } finally {
    await client.end()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
