import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, generateEntityId } from "@medusajs/framework/utils"
import { getPlatformPool } from "./platform-db"
import {
  resolveTenantForAdminRequest,
  resolveTenantSchema,
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

type ShippingOptionRuleRow = {
  id: string
  attribute: string
  operator: string
  value: string | boolean
}

type ShippingOptionRow = {
  id: string
  name: string
  provider_id: string
  shipping_profile_id: string
  profile_id: string
  profile_name: string
  profile_type: string
  rules: ShippingOptionRuleRow[]
}

type GeoZoneRow = {
  id: string
  type: string
  country_code: string
  province_code: string | null
  city: string | null
  postal_expression: unknown
}

type ServiceZoneRow = {
  id: string
  name: string
  geo_zones: GeoZoneRow[]
  shipping_options: Array<{
    id: string
    name: string
    provider_id: string
    shipping_profile_id: string
    shipping_profile: { id: string; name: string; type: string }
    rules: ShippingOptionRuleRow[]
  }>
}

type FulfillmentSetRow = {
  id: string
  name: string
  type: string
  service_zones: ServiceZoneRow[]
}

type FulfillmentProviderRow = {
  id: string
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
  fulfillment_sets: FulfillmentSetRow[]
  fulfillment_providers: FulfillmentProviderRow[]
}

type AddressInput = {
  address_1?: string | null
  address_2?: string | null
  city?: string | null
  province?: string | null
  postal_code?: string | null
  country_code?: string | null
  company?: string | null
  phone?: string | null
}

function quoteSchema(schema: string): string {
  return `"${schema.replace(/"/g, '""')}"`
}

function optionalString(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null
  }

  const trimmed = value.trim()
  return trimmed || null
}

export async function resolveStockLocationRequestSchema(
  req: MedusaRequest
): Promise<string | null> {
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
    fulfillment_providers: location.fulfillment_providers ?? [],
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

function parseRuleValue(value: unknown): string | boolean {
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "string") {
    if (value === "true") {
      return true
    }
    if (value === "false") {
      return false
    }
    return value
  }

  return String(value ?? "")
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

async function loadFulfillmentProvidersForLocation(
  schema: string,
  locationId: string
): Promise<FulfillmentProviderRow[]> {
  const schemaQ = quoteSchema(schema)
  const result = await getPlatformPool().query<{ fulfillment_provider_id: string }>(
    `select fulfillment_provider_id
     from ${schemaQ}.location_fulfillment_provider
     where stock_location_id = $1 and deleted_at is null`,
    [locationId]
  )

  return result.rows.map((row) => ({ id: row.fulfillment_provider_id }))
}

async function loadShippingOptionsForZone(
  schema: string,
  serviceZoneId: string
): Promise<ServiceZoneRow["shipping_options"]> {
  const schemaQ = quoteSchema(schema)
  const options = await getPlatformPool().query<ShippingOptionRow>(
    `select so.id, so.name, so.provider_id, so.shipping_profile_id,
            sp.id as profile_id, sp.name as profile_name, sp.type as profile_type
     from ${schemaQ}.shipping_option so
     left join ${schemaQ}.shipping_profile sp on sp.id = so.shipping_profile_id
     where so.service_zone_id = $1 and so.deleted_at is null
     order by so.name asc`,
    [serviceZoneId]
  )

  const result: ServiceZoneRow["shipping_options"] = []

  for (const option of options.rows) {
    const rules = await getPlatformPool().query<ShippingOptionRuleRow>(
      `select id, attribute, operator, value
       from ${schemaQ}.shipping_option_rule
       where shipping_option_id = $1`,
      [option.id]
    )

    result.push({
      id: option.id,
      name: option.name,
      provider_id: option.provider_id,
      shipping_profile_id: option.shipping_profile_id,
      shipping_profile: {
        id: option.profile_id ?? option.shipping_profile_id,
        name: option.profile_name ?? "Default Shipping Profile",
        type: option.profile_type ?? "default",
      },
      rules: rules.rows.map((rule) => ({
        id: rule.id,
        attribute: rule.attribute,
        operator: rule.operator,
        value: parseRuleValue(rule.value),
      })),
    })
  }

  return result
}

async function loadFulfillmentSetsForLocation(
  schema: string,
  locationId: string
): Promise<FulfillmentSetRow[]> {
  const schemaQ = quoteSchema(schema)
  const sets = await getPlatformPool().query<{
    id: string
    name: string
    type: string
  }>(
    `select fs.id, fs.name, fs.type
     from ${schemaQ}.fulfillment_set fs
     join ${schemaQ}.location_fulfillment_set lfs on lfs.fulfillment_set_id = fs.id
     where lfs.stock_location_id = $1
       and fs.deleted_at is null
       and lfs.deleted_at is null
     order by fs.created_at asc`,
    [locationId]
  )

  const fulfillmentSets: FulfillmentSetRow[] = []

  for (const set of sets.rows) {
    const zones = await getPlatformPool().query<{ id: string; name: string }>(
      `select id, name
       from ${schemaQ}.service_zone
       where fulfillment_set_id = $1 and deleted_at is null
       order by created_at asc`,
      [set.id]
    )

    const serviceZones: ServiceZoneRow[] = []

    for (const zone of zones.rows) {
      const geoZones = await getPlatformPool().query<GeoZoneRow>(
        `select id, type, country_code, province_code, city, postal_expression
         from ${schemaQ}.geo_zone
         where service_zone_id = $1 and deleted_at is null
         order by country_code asc`,
        [zone.id]
      )

      serviceZones.push({
        id: zone.id,
        name: zone.name,
        geo_zones: geoZones.rows,
        shipping_options: await loadShippingOptionsForZone(schema, zone.id),
      })
    }

    fulfillmentSets.push({
      id: set.id,
      name: set.name,
      type: set.type,
      service_zones: serviceZones,
    })
  }

  return fulfillmentSets
}

async function hydrateStockLocation(
  schema: string,
  row: StockLocationRow
): Promise<TenantStockLocation> {
  const [sales_channels, fulfillment_sets, fulfillment_providers] =
    await Promise.all([
      loadSalesChannelsForLocation(schema, row.id),
      loadFulfillmentSetsForLocation(schema, row.id),
      loadFulfillmentProvidersForLocation(schema, row.id),
    ])

  return sanitizeStockLocation({
    id: row.id,
    name: row.name,
    metadata: row.metadata,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
    address: mapAddress(row),
    sales_channels,
    fulfillment_sets,
    fulfillment_providers,
  })
}

async function loadStockLocationRow(
  schema: string,
  id: string
): Promise<StockLocationRow | null> {
  const schemaQ = quoteSchema(schema)
  const result = await getPlatformPool().query<StockLocationRow>(
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
     where sl.id = $1 and sl.deleted_at is null`,
    [id]
  )

  return result.rows[0] ?? null
}

export async function loadTenantStockLocation(
  schema: string,
  id: string
): Promise<TenantStockLocation> {
  const row = await loadStockLocationRow(schema, id)

  if (!row) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Stock location with id: ${id} was not found`
    )
  }

  return hydrateStockLocation(schema, row)
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
    rowsResult.rows.map((row) => hydrateStockLocation(schema, row))
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

async function linkDefaultSalesChannelSql(schema: string, locationId: string) {
  const salesChannelId = await loadDefaultSalesChannelId(schema)
  if (!salesChannelId) {
    return
  }

  const schemaQ = quoteSchema(schema)
  const existing = await getPlatformPool().query<{ id: string }>(
    `select id from ${schemaQ}.sales_channel_stock_location
     where stock_location_id = $1 and sales_channel_id = $2 and deleted_at is null`,
    [locationId, salesChannelId]
  )

  if (existing.rows[0]) {
    return
  }

  await getPlatformPool().query(
    `insert into ${schemaQ}.sales_channel_stock_location (
       id, sales_channel_id, stock_location_id, created_at, updated_at
     ) values ($1, $2, $3, now(), now())`,
    [generateEntityId(undefined, "scloc"), salesChannelId, locationId]
  )
}

async function createStockLocationSql(
  schema: string,
  body: { name?: string; address?: AddressInput }
): Promise<string> {
  const schemaQ = quoteSchema(schema)
  const locationId = generateEntityId(undefined, "sloc")
  const addressId = generateEntityId(undefined, "laddr")
  const name = body.name?.trim() || "Tienda"
  const address = body.address ?? {}

  await getPlatformPool().query(
    `insert into ${schemaQ}.stock_location_address (
       id, address_1, address_2, company, city, country_code, phone, province, postal_code,
       created_at, updated_at
     ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now())`,
    [
      addressId,
      optionalString(address.address_1),
      optionalString(address.address_2),
      optionalString(address.company),
      optionalString(address.city),
      optionalString(address.country_code)?.toLowerCase() ?? null,
      optionalString(address.phone),
      optionalString(address.province),
      optionalString(address.postal_code),
    ]
  )

  await getPlatformPool().query(
    `insert into ${schemaQ}.stock_location (
       id, name, address_id, created_at, updated_at
     ) values ($1, $2, $3, now(), now())`,
    [locationId, name, addressId]
  )

  await linkDefaultSalesChannelSql(schema, locationId)
  return locationId
}

async function updateStockLocationSql(
  schema: string,
  id: string,
  body: { name?: string; address?: AddressInput }
) {
  const existing = await loadStockLocationRow(schema, id)
  if (!existing) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Stock location with id: ${id} was not found`
    )
  }

  const schemaQ = quoteSchema(schema)

  if (body.name !== undefined) {
    await getPlatformPool().query(
      `update ${schemaQ}.stock_location
       set name = $2, updated_at = now()
       where id = $1 and deleted_at is null`,
      [id, body.name.trim() || "Tienda"]
    )
  }

  if (body.address !== undefined) {
    const address = body.address
    const values = [
      optionalString(address.address_1),
      optionalString(address.address_2),
      optionalString(address.company),
      optionalString(address.city),
      optionalString(address.country_code)?.toLowerCase() ?? null,
      optionalString(address.phone),
      optionalString(address.province),
      optionalString(address.postal_code),
    ]

    if (existing.address_id) {
      await getPlatformPool().query(
        `update ${schemaQ}.stock_location_address
         set address_1 = $2,
             address_2 = $3,
             company = $4,
             city = $5,
             country_code = $6,
             phone = $7,
             province = $8,
             postal_code = $9,
             updated_at = now()
         where id = $1 and deleted_at is null`,
        [existing.address_id, ...values]
      )
    } else {
      const addressId = generateEntityId(undefined, "laddr")
      await getPlatformPool().query(
        `insert into ${schemaQ}.stock_location_address (
           id, address_1, address_2, company, city, country_code, phone, province, postal_code,
           created_at, updated_at
         ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now())`,
        [addressId, ...values]
      )

      await getPlatformPool().query(
        `update ${schemaQ}.stock_location
         set address_id = $2, updated_at = now()
         where id = $1 and deleted_at is null`,
        [id, addressId]
      )
    }
  }
}

export async function tenantAdminStockLocationsListShim(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    const schema = await resolveStockLocationRequestSchema(req)
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
    const schema = await resolveStockLocationRequestSchema(req)
    if (!schema) {
      next()
      return
    }

    const id = req.params.id
    if (!id) {
      next()
      return
    }

    const stock_location = await loadTenantStockLocation(schema, id)
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
    const schema = await resolveStockLocationRequestSchema(req)
    if (!schema) {
      next()
      return
    }

    const body = (req.body ?? {}) as {
      name?: string
      address?: AddressInput
    }

    const locationId = await createStockLocationSql(schema, body)
    const stock_location = await loadTenantStockLocation(schema, locationId)
    res.json({ stock_location })
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
    const schema = await resolveStockLocationRequestSchema(req)
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
      address?: AddressInput
    }

    await updateStockLocationSql(schema, id, body)
    const stock_location = await loadTenantStockLocation(schema, id)
    res.json({ stock_location })
  } catch (error) {
    next(error)
  }
}
