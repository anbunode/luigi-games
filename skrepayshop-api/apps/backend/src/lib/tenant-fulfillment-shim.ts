import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, generateEntityId } from "@medusajs/framework/utils"
import { getPlatformPool } from "./platform-db"
import {
  loadTenantStockLocation,
  resolveStockLocationRequestSchema,
} from "./tenant-stock-locations-shim"

function quoteSchema(schema: string): string {
  return `"${schema.replace(/"/g, '""')}"`
}

type GeoZoneInput = {
  type?: string
  country_code: string
  province_code?: string | null
  city?: string | null
  postal_expression?: unknown
}

async function ensureLocationExists(schema: string, locationId: string) {
  const schemaQ = quoteSchema(schema)
  const result = await getPlatformPool().query<{ id: string }>(
    `select id from ${schemaQ}.stock_location where id = $1 and deleted_at is null`,
    [locationId]
  )

  if (!result.rows[0]) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Stock location with id: ${locationId} was not found`
    )
  }
}

async function ensureFulfillmentSetInSchema(schema: string, fulfillmentSetId: string) {
  const schemaQ = quoteSchema(schema)
  const result = await getPlatformPool().query<{ id: string }>(
    `select id from ${schemaQ}.fulfillment_set where id = $1 and deleted_at is null`,
    [fulfillmentSetId]
  )

  if (!result.rows[0]) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Fulfillment set with id: ${fulfillmentSetId} was not found`
    )
  }
}

async function findFulfillmentSetByType(
  schema: string,
  locationId: string,
  type: string
): Promise<string | null> {
  const schemaQ = quoteSchema(schema)
  const result = await getPlatformPool().query<{ id: string }>(
    `select fs.id
     from ${schemaQ}.fulfillment_set fs
     join ${schemaQ}.location_fulfillment_set lfs on lfs.fulfillment_set_id = fs.id
     where lfs.stock_location_id = $1
       and fs.type = $2
       and fs.deleted_at is null
       and lfs.deleted_at is null
     limit 1`,
    [locationId, type]
  )

  return result.rows[0]?.id ?? null
}

async function linkFulfillmentProvider(
  schema: string,
  locationId: string,
  providerId: string
) {
  const schemaQ = quoteSchema(schema)
  const existing = await getPlatformPool().query<{ id: string }>(
    `select id from ${schemaQ}.location_fulfillment_provider
     where stock_location_id = $1
       and fulfillment_provider_id = $2
       and deleted_at is null`,
    [locationId, providerId]
  )

  if (existing.rows[0]) {
    return
  }

  await getPlatformPool().query(
    `insert into ${schemaQ}.location_fulfillment_provider (
       id, stock_location_id, fulfillment_provider_id, created_at, updated_at
     ) values ($1, $2, $3, now(), now())`,
    [generateEntityId(undefined, "locfp"), locationId, providerId]
  )
}

export async function createFulfillmentSetForLocationSql(
  schema: string,
  locationId: string,
  input: { name: string; type: string }
): Promise<void> {
  await ensureLocationExists(schema, locationId)

  const existingId = await findFulfillmentSetByType(schema, locationId, input.type)
  if (existingId) {
    return
  }

  const schemaQ = quoteSchema(schema)
  const fulfillmentSetId = generateEntityId(undefined, "fuset")
  const linkId = generateEntityId(undefined, "locfs")

  await getPlatformPool().query(
    `insert into ${schemaQ}.fulfillment_set (
       id, name, type, created_at, updated_at
     ) values ($1, $2, $3, now(), now())`,
    [fulfillmentSetId, input.name, input.type]
  )

  await getPlatformPool().query(
    `insert into ${schemaQ}.location_fulfillment_set (
       id, stock_location_id, fulfillment_set_id, created_at, updated_at
     ) values ($1, $2, $3, now(), now())`,
    [linkId, locationId, fulfillmentSetId]
  )

  if (input.type === "shipping") {
    await linkFulfillmentProvider(schema, locationId, "manual_manual")
  }
}

export async function updateFulfillmentProvidersForLocationSql(
  schema: string,
  locationId: string,
  input: { add?: string[]; remove?: string[] }
) {
  await ensureLocationExists(schema, locationId)
  const schemaQ = quoteSchema(schema)

  for (const providerId of input.add ?? []) {
    await linkFulfillmentProvider(schema, locationId, providerId)
  }

  for (const providerId of input.remove ?? []) {
    await getPlatformPool().query(
      `update ${schemaQ}.location_fulfillment_provider
       set deleted_at = now(), updated_at = now()
       where stock_location_id = $1
         and fulfillment_provider_id = $2
         and deleted_at is null`,
      [locationId, providerId]
    )
  }
}

export async function deleteFulfillmentSetSql(schema: string, fulfillmentSetId: string) {
  await ensureFulfillmentSetInSchema(schema, fulfillmentSetId)
  const schemaQ = quoteSchema(schema)

  await getPlatformPool().query(
    `update ${schemaQ}.location_fulfillment_set
     set deleted_at = now(), updated_at = now()
     where fulfillment_set_id = $1 and deleted_at is null`,
    [fulfillmentSetId]
  )

  await getPlatformPool().query(
    `update ${schemaQ}.fulfillment_set
     set deleted_at = now(), updated_at = now()
     where id = $1 and deleted_at is null`,
    [fulfillmentSetId]
  )
}

export async function createServiceZoneSql(
  schema: string,
  fulfillmentSetId: string,
  input: { name: string; geo_zones: GeoZoneInput[] }
) {
  await ensureFulfillmentSetInSchema(schema, fulfillmentSetId)
  const schemaQ = quoteSchema(schema)
  const serviceZoneId = generateEntityId(undefined, "serzo")

  await getPlatformPool().query(
    `insert into ${schemaQ}.service_zone (
       id, name, fulfillment_set_id, created_at, updated_at
     ) values ($1, $2, $3, now(), now())`,
    [serviceZoneId, input.name, fulfillmentSetId]
  )

  for (const geoZone of input.geo_zones ?? []) {
    await getPlatformPool().query(
      `insert into ${schemaQ}.geo_zone (
         id, type, country_code, province_code, city, postal_expression,
         service_zone_id, created_at, updated_at
       ) values ($1, $2, $3, $4, $5, $6, $7, now(), now())`,
      [
        generateEntityId(undefined, "fgz"),
        geoZone.type ?? "country",
        geoZone.country_code.toLowerCase(),
        geoZone.province_code ?? null,
        geoZone.city ?? null,
        geoZone.postal_expression
          ? JSON.stringify(geoZone.postal_expression)
          : null,
        serviceZoneId,
      ]
    )
  }
}

export async function tenantAdminStockLocationFulfillmentSetsPostShim(
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

    const locationId = req.params.id
    const body = (req.body ?? {}) as { name?: string; type?: string }

    if (!locationId || !body.name || !body.type) {
      next()
      return
    }

    await createFulfillmentSetForLocationSql(schema, locationId, {
      name: body.name,
      type: body.type,
    })

    const stock_location = await loadTenantStockLocation(schema, locationId)
    res.json({ stock_location })
  } catch (error) {
    next(error)
  }
}

export async function tenantAdminStockLocationFulfillmentProvidersPostShim(
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

    const locationId = req.params.id
    const body = (req.body ?? {}) as { add?: string[]; remove?: string[] }

    if (!locationId) {
      next()
      return
    }

    await updateFulfillmentProvidersForLocationSql(schema, locationId, body)
    const stock_location = await loadTenantStockLocation(schema, locationId)
    res.json({ stock_location })
  } catch (error) {
    next(error)
  }
}

export async function tenantAdminFulfillmentSetDeleteShim(
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

    await deleteFulfillmentSetSql(schema, id)
    res.json({ id, object: "fulfillment_set", deleted: true })
  } catch (error) {
    next(error)
  }
}

export async function tenantAdminFulfillmentSetServiceZonesPostShim(
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

    const fulfillmentSetId = req.params.id
    const body = (req.body ?? {}) as {
      name?: string
      geo_zones?: GeoZoneInput[]
    }

    if (!fulfillmentSetId || !body.name) {
      next()
      return
    }

    await createServiceZoneSql(schema, fulfillmentSetId, {
      name: body.name,
      geo_zones: body.geo_zones ?? [],
    })

    const schemaQ = quoteSchema(schema)
    const result = await getPlatformPool().query(
      `select id, name, type, metadata, created_at, updated_at, deleted_at
       from ${schemaQ}.fulfillment_set
       where id = $1 and deleted_at is null`,
      [fulfillmentSetId]
    )

    res.json({ fulfillment_set: result.rows[0] })
  } catch (error) {
    next(error)
  }
}
