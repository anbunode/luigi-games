import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  resolveTenantForAdminRequest,
  resolveTenantSchema,
  setTenantSearchPath,
} from "./tenant-db-scope"
import { enterTenantSchema } from "./tenant-schema-context"
import { syncTenantRegionCountryPool } from "./tenant-region-countries"

type ScopedRequest = MedusaRequest & {
  skrepayTenantSchema?: string
}

async function resolveRequestSchema(req: MedusaRequest): Promise<string | null> {
  const scoped = (req as ScopedRequest).skrepayTenantSchema
  if (scoped) {
    return scoped
  }

  const tenant = await resolveTenantForAdminRequest(req)
  const schema = tenant ? resolveTenantSchema(tenant) : null

  if (schema) {
    ;(req as ScopedRequest).skrepayTenantSchema = schema
  }

  return schema
}

/**
 * Antes de crear/actualizar regiones, asegura pool ISO disponible y scope tenant
 * persistente para workflows async de Medusa.
 */
export async function tenantRegionCountryPoolMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const schema = await resolveRequestSchema(req)

  if (!schema) {
    next()
    return
  }

  enterTenantSchema(schema)
  await setTenantSearchPath(req.scope, schema)

  try {
    await syncTenantRegionCountryPool(schema)
  } catch {
    // no bloquear el flujo nativo si el sync falla
  }

  next()
}
