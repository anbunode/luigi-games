import { Client } from "pg"

const PLATFORM_TABLE_PREFIX = "skrepayshop_"
const GLOBAL_MIGRATION_TABLES = new Set([
  "mikro_orm_migrations",
  "link_module_migrations",
  "script_migrations",
])

function sslForUrl(connectionString: string) {
  return connectionString.includes("localhost")
    ? undefined
    : { rejectUnauthorized: false }
}

export async function cloneMedusaSchemaFromPublic(
  connectionString: string,
  targetSchema: string
): Promise<number> {
  const client = new Client({
    connectionString,
    ssl: sslForUrl(connectionString),
  })

  await client.connect()

  await client.query(`create schema if not exists "${targetSchema}"`)

  const tables = await client.query<{ tablename: string }>(
    `select tablename
     from pg_tables
     where schemaname = 'public'
       and tablename not like $1
     order by tablename`,
    [`${PLATFORM_TABLE_PREFIX}%`]
  )

  let created = 0

  for (const { tablename } of tables.rows) {
    if (GLOBAL_MIGRATION_TABLES.has(tablename)) {
      continue
    }

    await client.query(
      `create table if not exists "${targetSchema}"."${tablename}"
       (like public."${tablename}" including all)`
    )
    created += 1
  }

  await client.end()
  return created
}
