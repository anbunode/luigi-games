import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
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

type StockLocationAddressRow = {
  id: string
  address_1: string | null
  address_2: string | null
  company: string | null
  city: string | null
  country_code: string | null
  phone: string | null
  province: string | null
  postal_code: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

type StockLocationRow = {
  id: string
  name: string
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  address_id: string | null
  address_1: string | null
  address_2: string | null
  company: string | null
  city: string | null
  country_code: string | null
  phone: string | null
  province: string | null
  postal_code: string | null
  address_metadata: Record<string, unknown> | null
  address_created_at: string | null
  address_updated_at: string | null
  address_deleted_at: string | null
}

type SalesChannelRow = {
  id: string
  name: string
  description: string | null
  is_disabled: boolean
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type TenantStockLocation = {
  id: string
  name: string
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  address: StockLocationAddressRow | null
  sales_channels: SalesChannelRow[]
  fulfillment_sets: unknown[]
  fulfillment_providers?: unknown[]
}

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

function sanitizeStockLocation(location: TenantStockLocation): TenantStockLocation {
  return {
    ...location,
    sales_channels: (location.sales_channels ?? []).filter(
      (channel): channel is SalesChannelRow =>
        channel != null && typeof channel === "object" && Boolean(channel.id)
    ),
    fulfillment_sets: location.fulfillment_sets ?? [],
  }
}

function mapAddress(row: StockLocationRow): StockLocationAddressRow | null {
  if (!row.address_id) {
    return null
  }

  return {
    id: row.address_id,
    address_1: row.address_1,
    address_2: row.address_2,
    company: row.company,
    city: row.city,
    country_code: row.country_code,
    phone: row.phone,
    province: row.province,
    postal_code: row.postal_code,
    metadata: row.address_metadata,
    created_at: row.address_created_at ?? row.created_at,
    updated_at: row.address_updated_at ?? row.updated_at,
    deleted_at: row.address_deleted_at,
  }
}

function mapStockLocationRow(
  row: StockLocationRow,
  sales_channels: SalesChannelRow[]
): TenantStockLocation {
  return sanitizeStockLocation({
    id: row.id,
    name: row.name,
    metadata: row.metadata,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
    address: mapAddress(row),
    sales_channels,
    fulfillment_sets: [],
    fulfillment_providers: [],
  })
}

async function loadSalesChannelsForLocation(
  schema: string,
  locationId: string
): Promise<SalesChannelRow[]> {
  const schemaQ = quoteSchema(schema)
  const result = await getPlatformPool().query<SalesChannelRow>(
    `select sc.id, sc.name, sc.description, sc.is_disabled, sc.metadata,
            sc.created_at, sc.updated_at, sc.deleted_at
     from ${schemaQ}.sales_channel_stock_location scl
     join ${schemaQ}.sales_channel sc on sc.id = scl.sales_channel_id
     where scl.stock_location_id = $1
       and scl.deleted_at is null
       and sc.deleted_at is null
     order by sc.name asc`,
    [locationId]
  )

  return result.rows
}

async function loadStockLocationRows(
  schema: string,
  options: {
    id?: string
    q?: string
    limit?: number
    offset?: number
  } = {}
): Promise<{ rows: TenantStockLocation[]; count: number }> {
  const schemaQ = quoteSchema(schema)
  const values: unknown[] = []
  const where: string[] = ["sl.deleted_at is null"]

  if (options.id) {
    values.push(options.id)
    where.push(`sl.id = $${values.length}`)
  }

  if (options.q) {
    values.push(`%${options.q}%`)
    where.push(`sl.name ilike $${values.length}`)
  }

  const whereSql = where.length ? `where ${where.join(" and ")}` : ""

  const countResult = await getPlatformPool().query<{ count: number }>(
    `select count(*)::int as count
     from ${schemaQ}.stock_location sl
     ${whereSql}`,
    values
  )

  const limit = options.limit ?? 20
  const offset = options.offset ?? 0
  const listValues = [...values, limit, offset]

  const rowsResult = await getPlatformPool().query<StockLocationRow>(
    `select
       sl.id,
       sl.name,
       sl.metadata,
       sl.created_at,
       sl.updated_at,
       sl.deleted_at,
       sl.address_id,
       sla.address_1,
       sla.address_2,
       sla.company,
       sla.city,
       sla.country_code,
       sla.phone,
       sla.province,
       sla.postal_code,
       sla.metadata as address_metadata,
       sla.created_at as address_created_at,
       sla.updated_at as address_updated_at,
       sla.deleted_at as address_deleted_at
     from ${schemaQ}.stock_location sl
     left join ${schemaQ}.stock_location_address sla
       on sla.id = sl.address_id and sla.deleted_at is null
     ${whereSql}
     order by sl.created_at desc
     limit $${listValues.length - 1}
     offset $${listValues.length}`,
    listValues
  )

  const rows = await Promise.all(
    rowsResult.rows.map(async (row) =>
      mapStockLocationRow(row, await loadSalesChannelsForLocation(schema, row.id))
    )
  )

  return {
    rows,
    count: countResult.rows[0]?.count ?? rows.length,
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

  await withTenantSchema(scope, schema, async () => {
    await linkSalesChannelsToStockLocationWorkflow(scope).run({
      input: {
        id: locationId,
        add: [salesChannelId],
      },
    })
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
    const q =
      typeof req.query.q === "string" && req.query.q.trim()
        ? req.query.q.trim()
        : undefined
    const id =
      typeof req.query.id === "string" && req.query.id.trim()
        ? req.query.id.trim()
        : undefined

    const { rows, count } = await loadStockLocationRows(schema, {
      id,
      q,
      limit,
      offset,
    })

    res.json({
      stock_locations: rows,
      count,
      offset,
      limit,
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

    const { rows } = await loadStockLocationRows(schema, { id, limit: 1, offset: 0 })
    const stock_location = rows[0]

    if (!stock_location) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Stock location with id: ${id} was not found`
      )
    }

    res.json({ stock_location })
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

    let locationId: string

    await withTenantSchema(req.scope, schema, async () => {
      const {
        result: [stock_location],
      } = await createStockLocationsWorkflow(req.scope).run({
        input: {
          locations: [locationInput as never],
        },
      })

      locationId = stock_location.id
    })

    await linkDefaultSalesChannel(req.scope, schema, locationId!)
    const { rows } = await loadStockLocationRows(schema, {
      id: locationId!,
      limit: 1,
      offset: 0,
    })

    res.json({ stock_location: rows[0] })
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
      await updateStockLocationsWorkflow(req.scope).run({
        input: {
          selector: { id },
          update: updateInput as never,
        },
      })
    })

    const { rows } = await loadStockLocationRows(schema, { id, limit: 1, offset: 0 })

    if (!rows[0]) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Stock location with id: ${id} was not found`
      )
    }

    res.json({ stock_location: rows[0] })
  } catch (error) {
    next(error)
  }
}
