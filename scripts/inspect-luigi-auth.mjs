import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../skrepayshop-api/apps/backend")
const pg = createRequire(resolve(backendRoot, "package.json"))("pg")
const email = "gmzulia01@gmail.com"

function loadEnv(name) {
  const raw = readFileSync(resolve(backendRoot, ".env"), "utf8")
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith(`${name}=`)) return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "")
  }
  return ""
}

const c = new pg.Client({ connectionString: loadEnv("DATABASE_URL"), ssl: { rejectUnauthorized: false } })
await c.connect()

const u = await c.query(`select id, email from public."user" where lower(email)=lower($1)`, [email])
console.log("user", u.rows)

const ai = await c.query(
  `select ai.* from public.auth_identity ai
   join public.provider_identity pi on pi.auth_identity_id = ai.id
   where lower(pi.entity_id)=lower($1)`,
  [email]
)
console.log("auth", ai.rows)

const tenant = await c.query(`select * from skrepayshop_tenants where slug='luigi-games'`)
console.log("tenant", tenant.rows[0])

const tUser = await c.query(`select count(*) from t_luigi_games."user"`)
console.log("t_luigi_games users", tUser.rows[0].count)

await c.end()
