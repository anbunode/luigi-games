import type { MedusaContainer } from "@medusajs/framework"
import type { EntityManager } from "@mikro-orm/knex"
import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { getAuthContextFromJwtToken } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { SkrepayTenant } from "./tenant-context"
import {
  getTenantBySlug,
  getTenantByUserId,
  resolveStoreTenant,
} from "./tenant-context"
import { tenantSchemaName, tenantHasDedicatedDatabase } from "./tenant-provisioner"
import { runWithTenantSchema } from "./tenant-schema-context"
import { ensureTenantPoolPatches } from "./tenant-pg-pool-patch"

type ScopedRequest = MedusaRequest & {
  skrepayTenantSchema?: string | null
  session?: {
    auth_context?: {
      actor_id?: string
      actor_type?: string
      app_metadata?: Record<string, unknown>
    }
  }
}

function quoteIdentifier(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

export function resolveTenantSchema(tenant: SkrepayTenant): string | null {
  if (!tenantHasDedicatedDatabase(tenant)) {
    return null
  }

  if (tenant.database_schema) {
    return tenant.database_schema
  }

  return tenantSchemaName(tenant.slug)
}

async function applySearchPath(
  scope: MedusaContainer,
  schema: string
): Promise<void> {
  const schemaSql = `SET search_path TO ${quoteIdentifier(schema)}`

  try {
    const knex = scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as {
      raw: (sql: string) => Promise<unknown>
    }
    await knex.raw(schemaSql)
  } catch {
    // PG_CONNECTION may be unavailable in some contexts
  }

  const manager = scope.resolve(
    ContainerRegistrationKeys.MANAGER
  ) as EntityManager
  await manager.getConnection().execute(schemaSql)
}

async function resetSearchPath(scope: MedusaContainer): Promise<void> {
  const schemaSql = "SET search_path TO public"

  try {
    const knex = scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as {
      raw: (sql: string) => Promise<unknown>
    }
    await knex.raw(schemaSql)
  } catch {
    // ignore
  }

  const manager = scope.resolve(
    ContainerRegistrationKeys.MANAGER
  ) as EntityManager
  await manager.getConnection().execute(schemaSql)
}

export async function setTenantSearchPath(
  scope: MedusaContainer,
  schema: string
): Promise<void> {
  await applySearchPath(scope, schema)
}

export async function resetTenantSearchPath(
  scope: MedusaContainer
): Promise<void> {
  await resetSearchPath(scope)
}

export async function withTenantSchema<T>(
  scope: MedusaContainer,
  schema: string,
  fn: () => Promise<T>
): Promise<T> {
  ensureTenantPoolPatches(scope)

  return runWithTenantSchema(schema, async () => {
    await setTenantSearchPath(scope, schema)

    try {
      return await fn()
    } finally {
      await resetTenantSearchPath(scope)
    }
  })
}

function readAuthContext(req: MedusaRequest) {
  const sessionContext = (req as ScopedRequest).session?.auth_context

  if (sessionContext?.actor_id && sessionContext.actor_type === "user") {
    return sessionContext
  }

  const authorization = req.headers.authorization

  if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) {
    return null
  }

  const config = req.scope.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
  const { http } = config.projectConfig

  if (!http.jwtSecret) {
    return null
  }

  return getAuthContextFromJwtToken(
    authorization,
    http.jwtSecret,
    ["bearer"],
    ["user"],
    http.jwtPublicKey,
    http.jwtVerifyOptions ?? http.jwtOptions
  )
}

async function resolveTenantForAdminRequest(
  req: MedusaRequest
): Promise<SkrepayTenant | null> {
  const authContext = readAuthContext(req)

  if (!authContext?.actor_id) {
    return null
  }

  const tenantSlug = authContext.app_metadata?.tenant_slug

  if (typeof tenantSlug === "string" && tenantSlug.trim()) {
    const bySlug = await getTenantBySlug(tenantSlug.trim().toLowerCase())
    if (bySlug) {
      return bySlug
    }
  }

  return getTenantByUserId(authContext.actor_id)
}

async function applyTenantScope(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
  tenant: SkrepayTenant | null
) {
  const schema = tenant ? resolveTenantSchema(tenant) : null

  if (!schema) {
    next()
    return
  }

  ensureTenantPoolPatches(req.scope)

  runWithTenantSchema(schema, () => {
    ;(req as ScopedRequest).skrepayTenantSchema = schema

    let cleanedUp = false
    const cleanup = () => {
      if (cleanedUp) {
        return
      }

      cleanedUp = true
      resetSearchPath(req.scope).catch(() => undefined)
    }

    res.on("finish", cleanup)
    res.on("close", cleanup)
    next()
  })
}

export async function tenantAdminDatabaseScopeMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    const tenant = await resolveTenantForAdminRequest(req)
    await applyTenantScope(req, res, next, tenant)
  } catch (error) {
    next(error)
  }
}

export async function tenantStoreDatabaseScopeMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    const tenant = await resolveStoreTenant(req)
    await applyTenantScope(req, res, next, tenant)
  } catch (error) {
    next(error)
  }
}

/** @deprecated Use tenantAdminDatabaseScopeMiddleware or tenantStoreDatabaseScopeMiddleware */
export async function tenantDatabaseScopeMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  return tenantAdminDatabaseScopeMiddleware(req, res, next)
}

export async function resolveTenantSchemaBySlug(
  slug: string
): Promise<string | null> {
  const tenant = await getTenantBySlug(slug)
  return tenant ? resolveTenantSchema(tenant) : null
}
