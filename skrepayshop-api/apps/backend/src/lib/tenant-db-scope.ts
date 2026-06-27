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

type ScopedRequest = MedusaRequest & {
  skrepayTenantSchema?: string | null
  session?: {
    auth_context?: { actor_id?: string; actor_type?: string }
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

export async function setTenantSearchPath(
  scope: MedusaContainer,
  schema: string
): Promise<void> {
  const manager = scope.resolve(
    ContainerRegistrationKeys.MANAGER
  ) as EntityManager
  await manager
    .getConnection()
    .execute(`set search_path to ${quoteIdentifier(schema)}`)
}

export async function resetTenantSearchPath(
  scope: MedusaContainer
): Promise<void> {
  const manager = scope.resolve(
    ContainerRegistrationKeys.MANAGER
  ) as EntityManager
  await manager.getConnection().execute(`set search_path to public`)
}

export async function withTenantSchema<T>(
  scope: MedusaContainer,
  schema: string,
  fn: () => Promise<T>
): Promise<T> {
  await setTenantSearchPath(scope, schema)

  try {
    return await fn()
  } finally {
    await resetTenantSearchPath(scope)
  }
}

function readBearerUserId(req: MedusaRequest): string | null {
  const sessionUserId = (req as ScopedRequest).session?.auth_context?.actor_id
  const sessionActorType = (req as ScopedRequest).session?.auth_context
    ?.actor_type

  if (sessionUserId && sessionActorType === "user") {
    return sessionUserId
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

  const authContext = getAuthContextFromJwtToken(
    authorization,
    http.jwtSecret,
    ["bearer"],
    ["user"],
    http.jwtPublicKey,
    http.jwtVerifyOptions ?? http.jwtOptions
  )

  return authContext?.actor_id ?? null
}

async function resolveTenantForScopedRequest(
  req: MedusaRequest
): Promise<SkrepayTenant | null> {
  const path = req.url?.split("?")[0] ?? ""

  if (path.startsWith("/store")) {
    return resolveStoreTenant(req)
  }

  if (path.startsWith("/admin")) {
    const userId = readBearerUserId(req)

    if (!userId) {
      return null
    }

    return getTenantByUserId(userId)
  }

  return null
}

export async function tenantDatabaseScopeMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    const tenant = await resolveTenantForScopedRequest(req)
    const schema = tenant ? resolveTenantSchema(tenant) : null

    if (!schema) {
      next()
      return
    }

    await setTenantSearchPath(req.scope, schema)
    ;(req as ScopedRequest).skrepayTenantSchema = schema

    let cleanedUp = false
    const cleanup = () => {
      if (cleanedUp) {
        return
      }

      cleanedUp = true
      resetTenantSearchPath(req.scope).catch(() => undefined)
    }

    res.on("finish", cleanup)
    res.on("close", cleanup)
    next()
  } catch (error) {
    next(error)
  }
}

export async function resolveTenantSchemaBySlug(
  slug: string
): Promise<string | null> {
  const tenant = await getTenantBySlug(slug)
  return tenant ? resolveTenantSchema(tenant) : null
}
