import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPrimaryStorefrontUrl } from "../../../lib/store-domains"
import { resolveStoreTenant } from "../../../lib/tenant-context"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const tenant = await resolveStoreTenant(req)

  if (!tenant) {
    res.status(400).json({
      message: "Missing tenant. Pass x-skrepay-tenant header or tenant_slug query.",
    })
    return
  }

  const primary_url = await getPrimaryStorefrontUrl(tenant.id)

  res.json({
    tenant_slug: tenant.slug,
    primary_url,
    database_status: tenant.database_status,
  })
}
