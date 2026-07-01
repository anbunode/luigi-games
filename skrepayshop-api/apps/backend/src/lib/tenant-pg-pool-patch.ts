import type { MedusaContainer } from "@medusajs/framework"
import type { EntityManager } from "@mikro-orm/knex"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { getActiveSearchPathSchemas } from "./tenant-schema-context"
import { formatSearchPathSql } from "./tenant-catalog-schema"

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

type ConnectionLike = {
  execute?: (sql: string, params?: unknown[]) => Promise<unknown>
  getKnex?: () => KnexLike
}

function searchPathSql(schema: string | null | undefined): string {
  if (schema) {
    return formatSearchPathSql([schema])
  }

  const schemas = getActiveSearchPathSchemas()
  if (schemas?.length) {
    return formatSearchPathSql(schemas)
  }

  return "SET search_path TO public"
}

async function applySearchPathOnConnection(
  execute: (sql: string, params?: unknown[]) => Promise<unknown>,
  schema: string | null | undefined
) {
  await execute(searchPathSql(schema))
}

async function setClientSearchPath(
  client: PgClient,
  schema: string | null | undefined
) {
  const sql = searchPathSql(schema)

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

async function resetClientSearchPath(client: PgClient): Promise<void> {
  const sql = "SET search_path TO public"

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

    if (getActiveSearchPathSchemas()?.length) {
      await setClientSearchPath(resource, null)
    }

    return resource
  }

  if (typeof pool.release === "function") {
    const originalRelease = pool.release.bind(pool)
    pool.release = async (resource: PgClient) => {
      if (getActiveSearchPathSchemas()?.length) {
        await resetClientSearchPath(resource)
      }

      return originalRelease(resource)
    }
  }
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

    if (getActiveSearchPathSchemas()?.length) {
      await setClientSearchPath(resource, null)
    }

    return resource
  }
}

export function patchKnex(knex: KnexLike | null | undefined): void {
  patchKnexClient(knex?.client)
}

function patchManagerConnection(connection: ConnectionLike | null | undefined): void {
  if (!connection?.execute || patchedPools.has(connection)) {
    return
  }

  patchedPools.add(connection)

  const originalExecute = connection.execute.bind(connection)
  connection.execute = async (sql: string, params?: unknown[]) => {
    const schemas = getActiveSearchPathSchemas()

    if (
      schemas?.length &&
      typeof sql === "string" &&
      !sql.trimStart().toUpperCase().startsWith("SET SEARCH_PATH")
    ) {
      await applySearchPathOnConnection(originalExecute, null)
    }

    return originalExecute(sql, params)
  }

  patchKnex(connection.getKnex?.())
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
    patchManagerConnection(manager.getConnection() as ConnectionLike)
  } catch {
    // ignore
  }
}
