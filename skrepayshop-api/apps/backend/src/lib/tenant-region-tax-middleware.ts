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

  const payload = body as { region?: { id?: string }; id?: string }
  if (typeof payload.region?.id === "string") {
    return payload.region.id
  }

  if (typeof payload.id === "string") {
    return payload.id
  }

  return null
}

function readCountryCodesFromBody(body: unknown): string[] {
  if (!body || typeof body !== "object") {
    return []
  }

  const payload = body as {
    countries?: unknown
    region?: { countries?: unknown }
  }

  const raw = payload.countries ?? payload.region?.countries

  if (!Array.isArray(raw)) {
    return []
  }

  return raw
    .map((entry) => {
      if (typeof entry === "string") {
        return entry.trim().toLowerCase()
      }

      if (entry && typeof entry === "object" && "iso_2" in entry) {
        const iso2 = (entry as { iso_2?: unknown }).iso_2
        return typeof iso2 === "string" ? iso2.trim().toLowerCase() : ""
      }

      return ""
    })
    .filter(Boolean)
}

function readCountryCodesFromResponse(body: unknown): string[] {
  if (!body || typeof body !== "object") {
    return []
  }

  const region = (body as { region?: { countries?: unknown } }).region
  const raw = region?.countries

  if (!Array.isArray(raw)) {
    return []
  }

  return raw
    .map((entry) => {
      if (typeof entry === "string") {
        return entry.trim().toLowerCase()
      }

      if (entry && typeof entry === "object" && "iso_2" in entry) {
        const iso2 = (entry as { iso_2?: unknown }).iso_2
        return typeof iso2 === "string" ? iso2.trim().toLowerCase() : ""
      }

      return ""
    })
    .filter(Boolean)
}

function readAutomaticTaxesFromBody(body: unknown): boolean | undefined {
  if (!body || typeof body !== "object") {
    return undefined
  }

  const payload = body as {
    automatic_taxes?: unknown
    region?: { automatic_taxes?: unknown }
  }

  const raw = payload.automatic_taxes ?? payload.region?.automatic_taxes

  if (typeof raw === "boolean") {
    return raw
  }

  return undefined
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

  const requestCountries = readCountryCodesFromBody(req.body)
  const requestAutomaticTaxes = readAutomaticTaxesFromBody(req.body)

  const originalJson = res.json.bind(res)

  res.json = ((body: unknown) => {
    const regionId =
      readRegionIdFromBody(body) ??
      (typeof req.params.id === "string" ? req.params.id : null)

    if (regionId && res.statusCode < 400) {
      const responseCountries = readCountryCodesFromResponse(body)
      const countryCodes = [...new Set([...requestCountries, ...responseCountries])]

      const runSync = () => {
        syncTaxesForRegion(schema, regionId, {
          tenantSchema: schema,
          countryCodes: countryCodes.length > 0 ? countryCodes : undefined,
          automaticTaxes: requestAutomaticTaxes,
        }).catch((error) => {
          console.error(
            `[skrepay] tax sync failed for region ${regionId}:`,
            error
          )
        })
      }

      // Ejecutar tras commit de la transacción Medusa.
      if (res.writableFinished) {
        runSync()
      } else {
        res.once("finish", runSync)
      }
    }

    return originalJson(body)
  }) as MedusaResponse["json"]

  next()
}
