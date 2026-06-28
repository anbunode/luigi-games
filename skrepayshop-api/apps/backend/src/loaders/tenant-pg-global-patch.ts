import { createRequire } from "module"
import { getActiveTenantSchema } from "../lib/tenant-schema-context"

function quoteIdent(value: string): string {
  return `"${value.replace(/"/g, '""')}`
}

type PgClient = {
  __skrepaySchema?: string | null
  query: (...args: unknown[]) => unknown
}

type PgModule = {
  Client: new (...args: unknown[]) => PgClient
}

let patched = false

function patchPgClientPrototype(pgModule: PgModule): void {
  const Client = pgModule?.Client
  if (!Client || (Client as unknown as { __skrepayPatched?: boolean }).__skrepayPatched) {
    return
  }

  const originalQuery = Client.prototype.query

  Client.prototype.query = function (this: PgClient, ...args: unknown[]) {
    const schema = getActiveTenantSchema()
    const lastSchema = this.__skrepaySchema ?? null

    if (schema === lastSchema) {
      return originalQuery.apply(this, args)
    }

    this.__skrepaySchema = schema ?? null
    const setSql = schema
      ? `SET search_path TO ${quoteIdent(schema)}`
      : "SET search_path TO public"

    const maybeCb = args[args.length - 1]

    if (typeof maybeCb === "function") {
      originalQuery.call(this, setSql, (err: Error | null) => {
        if (err) {
          ;(maybeCb as (e: Error | null) => void)(err)
          return
        }
        originalQuery.apply(this, args)
      })
      return undefined as unknown
    }

    return (originalQuery.call(this, setSql) as Promise<unknown>).then(() => {
      return originalQuery.apply(this, args)
    })
  }

  ;(Client as unknown as { __skrepayPatched?: boolean }).__skrepayPatched = true
}

export default async function tenantPgGlobalPatchLoader(): Promise<void> {
  if (patched) {
    return
  }

  patched = true

  const require = createRequire(import.meta.url)

  const pgPaths = [
    "pg",
    "@mikro-orm/postgresql/node_modules/pg",
  ]

  for (const pgPath of pgPaths) {
    try {
      const pgMod = require(pgPath) as PgModule
      patchPgClientPrototype(pgMod)
    } catch {
      // pg module may not be available at this path
    }
  }
}
