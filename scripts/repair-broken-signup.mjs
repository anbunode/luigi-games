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

const email = process.argv[2]?.trim().toLowerCase()

if (!email) {
  console.error("Uso: node scripts/repair-broken-signup.mjs correo@ejemplo.com")
  process.exit(1)
}

async function main() {
  const client = new pg.Client({
    connectionString: loadDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()

  try {
    const authRows = await client.query(
      `select distinct ai.id
       from auth_identity ai
       join provider_identity pi on pi.auth_identity_id = ai.id
       where lower(coalesce(pi.provider_metadata->>'email', pi.entity_id, '')) = lower($1)`,
      [email]
    )

    let authIds = authRows.rows.map((row) => row.id)

    if (!authIds.length) {
      const orphanAuth = await client.query(`select id from auth_identity`)
      authIds = orphanAuth.rows.map((row) => row.id)
    }

    if (authIds.length) {
      await client.query(
        `delete from provider_identity where auth_identity_id = any($1::text[])`,
        [authIds]
      )
      await client.query(`delete from auth_identity where id = any($1::text[])`, [
        authIds,
      ])
    }

    const deletedUsers = await client.query(
      `delete from public."user"
       where lower(email) = lower($1) and deleted_at is null
       returning id`,
      [email]
    )

    const tenants = await client.query(
      `delete from public.skrepayshop_tenants
       where lower(owner_email) = lower($1)
       returning slug`,
      [email]
    )

    await client.query(
      `delete from public.skrepayshop_verification_code where lower(email) = lower($1)`,
      [email]
    )

    console.log(`Cuenta reparada para ${email}.`)
    console.log(`Usuarios eliminados: ${deletedUsers.rowCount}`)
    console.log(`Identidades auth eliminadas: ${authIds.length}`)
    if (tenants.rowCount) {
      console.log(
        `Tenants eliminados: ${tenants.rows.map((row) => row.slug).join(", ")}`
      )
    }
    console.log("Regístrate de nuevo en https://skrepay.com/signup")
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
