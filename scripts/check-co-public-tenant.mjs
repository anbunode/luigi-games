import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../skrepayshop-api/apps/backend")
const pg = createRequire(resolve(backendRoot, "package.json"))("pg")

function loadEnv(name) {
  const raw = readFileSync(resolve(backendRoot, ".env"), "utf8")
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith(`${name}=`)) return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "")
  }
  return ""
}

const url = loadEnv("DATABASE_URL")
const client = new pg.Client({
  connectionString: url,
  ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false },
})
await client.connect()

for (const code of ["co", "af", "al"]) {
  for (const schema of ["public", "t_luigi_game"]) {
    const r = await client.query(
      `select iso_2, region_id, deleted_at from "${schema}".region_country where lower(iso_2) = $1`,
      [code]
    )
    console.log(schema, code, r.rows[0] ?? "MISSING")
  }
}

// Check if session user has tenant in metadata
const user = await client.query(
  `select id, email from "t_luigi_game"."user" where email like '%gmzulia%' limit 1`
)
console.log("tenant user", user.rows)

await client.end()
