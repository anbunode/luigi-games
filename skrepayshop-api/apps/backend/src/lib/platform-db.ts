import { Pool } from "pg"

let pool: Pool | null = null

export function getPlatformDatabaseUrl(): string {
  const connectionString =
    process.env.PLATFORM_DATABASE_URL || process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error("PLATFORM_DATABASE_URL or DATABASE_URL is not configured")
  }

  return connectionString
}

export function getPlatformPool(): Pool {
  if (!pool) {
    const connectionString = getPlatformDatabaseUrl()

    pool = new Pool({
      connectionString,
      ssl: connectionString.includes("localhost")
        ? undefined
        : { rejectUnauthorized: false },
    })
  }

  return pool
}
