import type { MedusaContainer } from "@medusajs/framework"
import type { EntityManager } from "@mikro-orm/knex"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { getActiveTenantSchema } from "./tenant-schema-context"

const patchedPools = new WeakSet<object>()

type PgClient = {
  query?: (sql: string) => Promise<unknown>
}

type TarnPool = {
  acquire?: () => Promise<PgClient>
  release?: (resource: PgClient) => Promise<void> | void
}

function quoteIdentifier(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

async function setClientSearchPath(
  client: PgClient,
  schema: string | null | undefined
) {
  if (typeof client?.query !== "function") {
    return
  }

  const sql = schema
    ? `SET search_path TO ${quoteIdentifier(schema)}`
    : "SET search_path TO public"

  try {
    await client.query(sql)
  } catch {
    // ignore
  }
}

export function patchPgPool(pool: TarnPool | null | undefined): void {
  if (!pool?.acquire || patchedPools.has(pool)) {
    return
  }

  patchedPools.add(pool)

  const originalAcquire = pool.acquire.bind(pool)
  pool.acquire = async () => {
    const resource = await originalAcquire()
    const schema = getActiveTenantSchema()

    if (schema) {
      await setClientSearchPath(resource, schema)
    }

    return resource
  }

  if (typeof pool.release === "function") {
    const originalRelease = pool.release.bind(pool)
    pool.release = async (resource: PgClient) => {
      if (getActiveTenantSchema()) {
        await setClientSearchPath(resource, null)
      }

      return originalRelease(resource)
    }
  }
}

type KnexLike = {
  client?: { pool?: TarnPool }
}

export function patchKnex(knex: KnexLike | null | undefined): void {
  patchPgPool(knex?.client?.pool)
}

export function ensureTenantPoolPatches(scope: MedusaContainer): void {
  try {
    const knex = scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as KnexLike
    patchKnex(knex)
  } catch {
    // ignore
  }

  try {
    const manager = scope.resolve(
      ContainerRegistrationKeys.MANAGER
    ) as EntityManager
    const connection = manager.getConnection() as {
      getKnex?: () => KnexLike
    }
    patchKnex(connection.getKnex?.())
  } catch {
    // ignore
  }
}
