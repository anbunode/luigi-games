import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import {
  createStockLocationsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStockLocationsWorkflow,
} from "@medusajs/medusa/core-flows"
import { getPlatformPool } from "./platform-db"
import {
  resolveTenantForAdminRequest,
  resolveTenantSchema,
  withTenantSchema,
} from "./tenant-db-scope"

type ScopedRequest = MedusaRequest & {
  skrepayTenantSchema?: string
}

const DEFAULT_LIST_FIELDS = [
  "id",
  "name",
  "*address",
  "*sales_channels",
  "*fulfillment_sets",
  "*fulfillment_sets.service_zones",
  "*fulfillment_sets.service_zones.shipping_options",
  "*fulfillment_sets.service_zones.shipping_options.shipping_profile",
]

const DEFAULT_DETAIL_FIELDS = [
  "id",
  "name",
  "*address",
  "*sales_channels",
  "*fulfillment_sets",
  "*fulfillment_providers",
  "*fulfillment_sets.service_zones",
  "*fulfillment_sets.service_zones.geo_zones",
  "*fulfillment_sets.service_zones.shipping_options",
  "*fulfillment_sets.service_zones.shipping_options.shipping_profile",
  "*fulfillment_sets.service_zones.shipping_options.rules",
]

function quoteSchema(schema: string): string {
  return `"${schema.replace(/"/g, '""')}"`
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

function parseGraphFields(raw: unknown, fallback: string[]): string[] {
  if (typeof raw !== "string" || !raw.trim()) {
    return fallback
  }

  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
}

function sanitizeStockLocation<T extends { sales_channels?: unknown }>(
  location: T
): T {
  if (!location || !Array.isArray(location.sales_channels)) {
    return location
  }

  return {
    ...location,
    sales_channels: location.sales_channels.filter(
      (channel): channel is NonNullable<typeof channel> =>
        channel != null && typeof channel === "object"
    ),
  }
}

async function loadDefaultSalesChannelId(schema: string): Promise<string | null> {
  const schemaQ = quoteSchema(schema)
  const result = await getPlatformPool().query<{ default_sales_channel_id: string | null }>(
    `select default_sales_channel_id
     from ${schemaQ}.store
     where deleted_at is null
     order by created_at asc
     limit 1`
  )

  return result.rows[0]?.default_sales_channel_id ?? null
}

async function linkDefaultSalesChannel(
  scope: MedusaRequest["scope"],
  schema: string,
  locationId: string
) {
  const salesChannelId = await loadDefaultSalesChannelId(schema)

  if (!salesChannelId) {
    return
  }

  await linkSalesChannelsToStockLocationWorkflow(scope).run({
    input: {
      id: locationId,
      add: [salesChannelId],
    },
  })
}

export async function tenantAdminStockLocationsListShim(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    const schema = await resolveRequestSchema(req)
    if (!schema) {
      next()
      return
    }

    const limit = Math.min(Number(req.query.limit ?? 20) || 20, 100)
    const offset = Number(req.query.offset ?? 0) || 0
    const fields = parseGraphFields(req.query.fields, DEFAULT_LIST_FIELDS)
    const filters: Record<string, unknown> = {}

    if (typeof req.query.q === "string" && req.query.q.trim()) {
      filters.name = { $ilike: `%${req.query.q.trim()}%` }
    }

    if (typeof req.query.id === "string" && req.query.id.trim()) {
      filters.id = req.query.id.trim()
    }

    await withTenantSchema(req.scope, schema, async () => {
      const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
      const { data: stock_locations, metadata } = await query.graph({
        entity: "stock_location",
        fields,
        filters,
        pagination: { skip: offset, take: limit },
      })

      res.json({
        stock_locations: (stock_locations ?? []).map(sanitizeStockLocation),
        count: metadata?.count ?? stock_locations?.length ?? 0,
        offset,
        limit,
      })
    })
  } catch (error) {
    next(error)
  }
}

export async function tenantAdminStockLocationByIdGetShim(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    const schema = await resolveRequestSchema(req)
    if (!schema) {
      next()
      return
    }

    const id = req.params.id

    if (!id) {
      next()
      return
    }

    const fields = parseGraphFields(req.query.fields, DEFAULT_DETAIL_FIELDS)

    await withTenantSchema(req.scope, schema, async () => {
      const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
      const { data: stock_locations } = await query.graph({
        entity: "stock_location",
        fields,
        filters: { id },
      })

      const stock_location = stock_locations?.[0]

      if (!stock_location) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Stock location with id: ${id} was not found`
        )
      }

      res.json({ stock_location: sanitizeStockLocation(stock_location) })
    })
  } catch (error) {
    next(error)
  }
}

export async function tenantAdminStockLocationsPostShim(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    const schema = await resolveRequestSchema(req)
    if (!schema) {
      next()
      return
    }

    const body = (req.body ?? {}) as {
      name?: string
      address?: {
        address_1?: string | null
        address_2?: string | null
        city?: string | null
        province?: string | null
        postal_code?: string | null
        country_code?: string | null
        company?: string | null
        phone?: string | null
      }
    }

    const locationInput = {
      name: body.name?.trim() || "Tienda",
      ...(body.address ? { address: body.address } : {}),
    }

    await withTenantSchema(req.scope, schema, async () => {
      const {
        result: [stock_location],
      } = await createStockLocationsWorkflow(req.scope).run({
        input: {
          locations: [locationInput as never],
        },
      })

      await linkDefaultSalesChannel(req.scope, schema, stock_location.id)

      const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
      const { data: stock_locations } = await query.graph({
        entity: "stock_location",
        fields: DEFAULT_LIST_FIELDS,
        filters: { id: stock_location.id },
      })

      const hydrated = stock_locations?.[0] ?? stock_location

      res.json({ stock_location: sanitizeStockLocation(hydrated) })
    })
  } catch (error) {
    next(error)
  }
}

export async function tenantAdminStockLocationByIdPostShim(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    const schema = await resolveRequestSchema(req)
    if (!schema) {
      next()
      return
    }

    const id = req.params.id

    if (!id) {
      next()
      return
    }

    const body = (req.body ?? {}) as {
      name?: string
      address?: {
        address_1?: string | null
        address_2?: string | null
        city?: string | null
        province?: string | null
        postal_code?: string | null
        country_code?: string | null
        company?: string | null
        phone?: string | null
      }
    }

    const updateInput = {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.address !== undefined ? { address: body.address } : {}),
    }

    await withTenantSchema(req.scope, schema, async () => {
      const {
        result: [stock_location],
      } = await updateStockLocationsWorkflow(req.scope).run({
        input: {
          selector: { id },
          update: updateInput as never,
        },
      })

      const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
      const { data: stock_locations } = await query.graph({
        entity: "stock_location",
        fields: DEFAULT_LIST_FIELDS,
        filters: { id: stock_location.id },
      })

      const hydrated = stock_locations?.[0] ?? stock_location

      res.json({ stock_location: sanitizeStockLocation(hydrated) })
    })
  } catch (error) {
    next(error)
  }
}
