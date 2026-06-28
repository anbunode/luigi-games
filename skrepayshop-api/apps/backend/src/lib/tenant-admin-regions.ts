import type { MedusaRequest } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type AdminRegion = {
  currency_code?: string
}

export async function listAdminRegionCurrencyCodes(
  req: MedusaRequest
): Promise<string[]> {
  const authorization = req.headers.authorization

  if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) {
    return []
  }

  const config = req.scope.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
  const configuredBackend =
    process.env.MEDUSA_BACKEND_URL ||
    (config.projectConfig as { admin?: { backendUrl?: string } }).admin?.backendUrl

  const host = req.headers.host
  const protocol = req.headers["x-forwarded-proto"] ?? "http"
  const backendUrl =
    configuredBackend ||
    (host ? `${protocol}://${host}` : "http://127.0.0.1:9000")

  const response = await fetch(`${backendUrl}/admin/regions?limit=200`, {
    headers: {
      authorization,
      "content-type": "application/json",
    },
  })

  if (!response.ok) {
    return []
  }

  const body = (await response.json()) as { regions?: AdminRegion[] }
  const codes = new Set<string>()

  for (const region of body.regions ?? []) {
    if (typeof region.currency_code === "string" && region.currency_code.trim()) {
      codes.add(region.currency_code.trim().toLowerCase())
    }
  }

  return [...codes]
}
