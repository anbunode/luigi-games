import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { mockCloudflareConnect } from "../../../../../lib/store-domains"
import { requireTenantFromRequest } from "../../../../../lib/tenant-context"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const tenant = await requireTenantFromRequest(req)
    const body = req.body as { domain_name?: string }
    const { domain, mock_zone_id } = await mockCloudflareConnect(
      tenant.id,
      body.domain_name ?? ""
    )

    res.status(201).json({
      success: true,
      status: "verifying",
      message:
        "Conexión Cloudflare simulada. La verificación DNS automática estará disponible en una fase posterior.",
      domain,
      mock_zone_id,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo conectar Cloudflare"
    res.status(400).json({ message })
  }
}
