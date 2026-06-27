import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getTenantBySlug } from "../../../lib/tenant-context"
import { resolveTenantSchema } from "../../../lib/tenant-db-scope"
import { getPlatformPool } from "../../../lib/platform-db"
import { getAdminRequestPath } from "../../../lib/request-path"

type ScopedRequest = MedusaRequest & {
  skrepayTenantSchema?: string
  auth_context?: { actor_id?: string; app_metadata?: Record<string, unknown> }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const path = getAdminRequestPath(req)
  const tenantSlug = req.auth_context?.app_metadata?.tenant_slug
  const tenant =
    typeof tenantSlug === "string"
      ? await getTenantBySlug(tenantSlug.trim().toLowerCase())
      : null
  const schema = tenant ? resolveTenantSchema(tenant) : null
  const scopedSchema = (req as ScopedRequest).skrepayTenantSchema ?? null
  let userInSchema = false

  if (schema && req.auth_context?.actor_id) {
    const result = await getPlatformPool().query(
      `select 1 from "${schema.replace(/"/g, '""')}"."user" where id = $1 limit 1`,
      [req.auth_context.actor_id]
    )
    userInSchema = result.rowCount > 0
  }

  res.json({
    path,
    tenant_slug: tenant?.slug ?? null,
    resolved_schema: schema,
    middleware_schema: scopedSchema,
    actor_id: req.auth_context?.actor_id ?? null,
    user_in_schema: userInSchema,
  })
}
