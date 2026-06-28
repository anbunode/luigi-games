import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  resolveTenantForAdminRequest,
  resolveTenantSchema,
} from "./tenant-db-scope"
import { syncTaxesForRegion } from "./tenant-region-tax-sync"

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

function readRegionIdFromBody(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return null
  }

  const region = (body as { region?: { id?: string } }).region
  return typeof region?.id === "string" ? region.id : null
}

export async function tenantRegionTaxSyncMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const schema = await resolveRequestSchema(req)

  if (!schema) {
    next()
    return
  }

  const originalJson = res.json.bind(res)

  res.json = ((body: unknown) => {
    const regionId =
      readRegionIdFromBody(body) ??
      (typeof req.params.id === "string" ? req.params.id : null)

    if (regionId && res.statusCode < 400) {
      syncTaxesForRegion(schema, regionId).catch(() => undefined)
    }

    return originalJson(body)
  }) as MedusaResponse["json"]

  next()
}
