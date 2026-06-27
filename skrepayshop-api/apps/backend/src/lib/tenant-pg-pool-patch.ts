import type { MedusaContainer } from "@medusajs/framework"
import type { EntityManager } from "@mikro-orm/knex"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { getActiveTenantSchema } from "./tenant-schema-context"

const patchedPools = new WeakSet<object>()

type PgClient = {
  query?: (
    sql: string,
    cb?: (err: Error | null) => void
  ) => Promise<unknown> | void
}

type TarnPool = {
  acquire?: () => Promise<PgClient>
  release?: (resource: PgClient) => Promise<void> | void
}

type KnexClient = {
  pool?: TarnPool
  acquireConnection?: () => Promise<PgClient>
}

type KnexLike = {
  client?: KnexClient
}

async function setClientSearchPath(
  client: PgClient,
  schema: string | null | undefined
) {
  const sql = schema
    ? `SET search_path TO ${quoteIdentifier(schema)}`
    : "SET search_path TO public"

  if (typeof client.query !== "function") {
    return
  }

  try {
    const result = client.query(sql)

    if (result && typeof (result as Promise<unknown>).then === "function") {
      await result
      return
    }

    await new Promise<void>((resolve, reject) => {
      client.query!(sql, (err) => {
        if (err) {
          reject(err)
          return
        }
        resolve()
      })
    })
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

function quoteIdentifier(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

function patchKnexClient(client: KnexClient | null | undefined): void {
  if (!client) {
    return
  }

  patchPgPool(client.pool)

  if (!client.acquireConnection || patchedPools.has(client)) {
    return
  }

  patchedPools.add(client)

  const originalAcquireConnection = client.acquireConnection.bind(client)
  client.acquireConnection = async () => {
    const resource = await originalAcquireConnection()
    const schema = getActiveTenantSchema()

    if (schema) {
      await setClientSearchPath(resource, schema)
    }

    return resource
  }
}

export function patchKnex(knex: KnexLike | null | undefined): void {
  patchKnexClient(knex?.client)
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
