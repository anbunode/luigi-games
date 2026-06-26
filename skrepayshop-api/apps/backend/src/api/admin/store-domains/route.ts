import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  createDomain,
  getPrimaryStorefrontUrl,
  listDomainsForTenant,
} from "../../../lib/store-domains"
import { requireTenantFromRequest } from "../../../lib/tenant-context"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const tenant = await requireTenantFromRequest(req)
    const domains = await listDomainsForTenant(tenant.id)
    const primary_url = await getPrimaryStorefrontUrl(tenant.id)

    res.json({ domains, primary_url, tenant_slug: tenant.slug })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized"
    res.status(message === "Unauthorized" ? 401 : 400).json({ message })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const tenant = await requireTenantFromRequest(req)
    const body = req.body as { domain_name?: string }
    const domain = await createDomain(tenant.id, body.domain_name ?? "")

    res.status(201).json({ domain })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo crear el dominio"
    res.status(400).json({ message })
  }
}
