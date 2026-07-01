import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, generateEntityId } from "@medusajs/framework/utils"
import { getPlatformPool } from "./platform-db"
import {
  resolveCatalogSchemaContext,
  stockLocationExistsInSchemas,
  uniqueSchemas,
  type CatalogSchemaContext,
} from "./tenant-catalog-schema"

type InventoryItemRow = {
  id: string
  sku: string | null
  origin_country: string | null
  hs_code: string | null
  mid_code: string | null
  material: string | null
  weight: number | null
  length: number | null
  height: number | null
  width: number | null
  requires_shipping: boolean
  description: string | null
  title: string | null
  thumbnail: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

type InventoryLevelRow = {
  id: string
  inventory_item_id: string
  location_id: string
  stocked_quantity: number
  reserved_quantity: number
  incoming_quantity: number
  raw_stocked_quantity: { value: string; precision: number } | null
  raw_reserved_quantity: { value: string; precision: number } | null
  raw_incoming_quantity: { value: string; precision: number } | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

type LocationLevelInput = {
  location_id: string
  stocked_quantity?: number
  incoming_quantity?: number
}

type CreateInventoryItemInput = {
  sku?: string | null
  hs_code?: string | null
  weight?: number | null
  length?: number | null
  height?: number | null
  width?: number | null
  origin_country?: string | null
  mid_code?: string | null
  material?: string | null
  title?: string | null
  description?: string | null
  requires_shipping?: boolean
  thumbnail?: string | null
  metadata?: Record<string, unknown> | null
  location_levels?: LocationLevelInput[]
}

type UpdateInventoryItemInput = Omit<CreateInventoryItemInput, "location_levels">

type BatchLevelCreate = LocationLevelInput & { inventory_item_id?: string }
type BatchLevelUpdate = LocationLevelInput & {
  id?: string
  inventory_item_id?: string
}

function quoteSchema(schema: string): string {
  return `"${schema.replace(/"/g, '""')}"`
}

function rawQuantity(value: number) {
  return JSON.stringify({ value: String(value), precision: 20 })
}

function parseQuantity(value: number | undefined, fallback = 0): number {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return fallback
  }

  return Math.max(0, Math.floor(value))
}

function mapInventoryLevel(row: InventoryLevelRow) {
  const stocked = Number(row.stocked_quantity ?? 0)
  const reserved = Number(row.reserved_quantity ?? 0)
  const incoming = Number(row.incoming_quantity ?? 0)

  return {
    id: row.id,
    inventory_item_id: row.inventory_item_id,
    location_id: row.location_id,
    stocked_quantity: stocked,
    reserved_quantity: reserved,
    incoming_quantity: incoming,
    available_quantity: stocked - reserved,
    raw_stocked_quantity: row.raw_stocked_quantity ?? {
      value: String(stocked),
      precision: 20,
    },
    raw_reserved_quantity: row.raw_reserved_quantity ?? {
      value: String(reserved),
      precision: 20,
    },
    raw_incoming_quantity: row.raw_incoming_quantity ?? {
      value: String(incoming),
      precision: 20,
    },
    metadata: row.metadata,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
  }
}

async function assertStockLocationExists(
  context: CatalogSchemaContext,
  locationId: string
) {
  const exists = await stockLocationExistsInSchemas(
    uniqueSchemas([context.catalogSchema, context.tenantSchema]),
    locationId
  )

  if (!exists) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Stock locations with ids: ${locationId} was not found`
    )
  }
}

async function assertInventoryItemExists(schema: string, itemId: string) {
  const schemaQ = quoteSchema(schema)
  const result = await getPlatformPool().query<{ id: string }>(
    `select id
     from ${schemaQ}.inventory_item
     where id = $1 and deleted_at is null`,
    [itemId]
  )

  if (!result.rows[0]) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Inventory item with id: ${itemId} was not found`
    )
  }
}

async function loadInventoryLevelRows(
  schema: string,
  itemId: string
): Promise<InventoryLevelRow[]> {
  const schemaQ = quoteSchema(schema)
  const result = await getPlatformPool().query<InventoryLevelRow>(
    `select id, inventory_item_id, location_id, stocked_quantity, reserved_quantity,
            incoming_quantity, raw_stocked_quantity, raw_reserved_quantity,
            raw_incoming_quantity, metadata, created_at, updated_at, deleted_at
     from ${schemaQ}.inventory_level
     where inventory_item_id = $1 and deleted_at is null
     order by created_at asc`,
    [itemId]
  )

  return result.rows
}

async function loadInventoryLevelByLocation(
  schema: string,
  itemId: string,
  locationId: string
): Promise<InventoryLevelRow | null> {
  const schemaQ = quoteSchema(schema)
  const result = await getPlatformPool().query<InventoryLevelRow>(
    `select id, inventory_item_id, location_id, stocked_quantity, reserved_quantity,
            incoming_quantity, raw_stocked_quantity, raw_reserved_quantity,
            raw_incoming_quantity, metadata, created_at, updated_at, deleted_at
     from ${schemaQ}.inventory_level
     where inventory_item_id = $1
       and location_id = $2
       and deleted_at is null`,
    [itemId, locationId]
  )

  return result.rows[0] ?? null
}

async function loadInventoryItemsList(
  schema: string,
  options: {
    limit?: number
    offset?: number
    q?: string
    id?: string
    sku?: string
    locationId?: string
  } = {}
) {
  const schemaQ = quoteSchema(schema)
  const limit = Math.min(options.limit ?? 20, 100)
  const offset = options.offset ?? 0
  const values: unknown[] = []
  const where: string[] = ["ii.deleted_at is null"]

  if (options.id) {
    values.push(options.id)
    where.push(`ii.id = $${values.length}`)
  }

  if (options.sku) {
    values.push(options.sku)
    where.push(`ii.sku = $${values.length}`)
  }

  if (options.q) {
    values.push(`%${options.q}%`)
    where.push(
      `(ii.sku ilike $${values.length} or ii.title ilike $${values.length} or ii.description ilike $${values.length})`
    )
  }

  if (options.locationId) {
    values.push(options.locationId)
    where.push(`exists (
      select 1
      from ${schemaQ}.inventory_level il
      where il.inventory_item_id = ii.id
        and il.location_id = $${values.length}
        and il.deleted_at is null
    )`)
  }

  const whereSql = where.length ? `where ${where.join(" and ")}` : ""

  const countResult = await getPlatformPool().query<{ count: number }>(
    `select count(*)::int as count
     from ${schemaQ}.inventory_item ii
     ${whereSql}`,
    values
  )

  values.push(limit, offset)
  const rowsResult = await getPlatformPool().query<InventoryItemRow>(
    `select ii.id, ii.sku, ii.origin_country, ii.hs_code, ii.mid_code, ii.material,
            ii.weight, ii.length, ii.height, ii.width, ii.requires_shipping,
            ii.description, ii.title, ii.thumbnail, ii.metadata,
            ii.created_at, ii.updated_at, ii.deleted_at
     from ${schemaQ}.inventory_item ii
     ${whereSql}
     order by ii.created_at desc
     limit $${values.length - 1}
     offset $${values.length}`,
    values
  )

  const inventory_items = await Promise.all(
    rowsResult.rows.map(async (row) => {
      const levels = await loadInventoryLevelRows(schema, row.id)
      const mappedLevels = levels.map(mapInventoryLevel)
      const stocked_quantity = mappedLevels.reduce(
        (sum, level) => sum + level.stocked_quantity,
        0
      )
      const reserved_quantity = mappedLevels.reduce(
        (sum, level) => sum + level.reserved_quantity,
        0
      )

      return {
        id: row.id,
        sku: row.sku,
        origin_country: row.origin_country,
        hs_code: row.hs_code,
        mid_code: row.mid_code,
        material: row.material,
        weight: row.weight,
        length: row.length,
        height: row.height,
        width: row.width,
        requires_shipping: row.requires_shipping,
        description: row.description,
        title: row.title,
        thumbnail: row.thumbnail,
        metadata: row.metadata,
        created_at: row.created_at,
        updated_at: row.updated_at,
        deleted_at: row.deleted_at,
        stocked_quantity,
        reserved_quantity,
        location_levels: mappedLevels,
      }
    })
  )

  return {
    inventory_items,
    count: countResult.rows[0]?.count ?? 0,
    offset,
    limit,
  }
}

export async function loadTenantInventoryItem(schema: string, id: string) {
  const schemaQ = quoteSchema(schema)
  const result = await getPlatformPool().query<InventoryItemRow>(
    `select id, sku, origin_country, hs_code, mid_code, material, weight, length, height,
            width, requires_shipping, description, title, thumbnail, metadata,
            created_at, updated_at, deleted_at
     from ${schemaQ}.inventory_item
     where id = $1 and deleted_at is null`,
    [id]
  )

  const row = result.rows[0]
  if (!row) {
    return null
  }

  const levels = await loadInventoryLevelRows(schema, id)
  const mappedLevels = levels.map(mapInventoryLevel)
  const stocked_quantity = mappedLevels.reduce(
    (sum, level) => sum + level.stocked_quantity,
    0
  )
  const reserved_quantity = mappedLevels.reduce(
    (sum, level) => sum + level.reserved_quantity,
    0
  )

  return {
    id: row.id,
    sku: row.sku,
    origin_country: row.origin_country,
    hs_code: row.hs_code,
    mid_code: row.mid_code,
    material: row.material,
    weight: row.weight,
    length: row.length,
    height: row.height,
    width: row.width,
    requires_shipping: row.requires_shipping,
    description: row.description,
    title: row.title,
    thumbnail: row.thumbnail,
    metadata: row.metadata,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
    stocked_quantity,
    reserved_quantity,
    location_levels: mappedLevels,
  }
}

async function createInventoryLevelSql(
  context: CatalogSchemaContext,
  itemId: string,
  input: LocationLevelInput
) {
  const schema = context.catalogSchema
  await assertStockLocationExists(context, input.location_id)

  const existing = await loadInventoryLevelByLocation(
    schema,
    itemId,
    input.location_id
  )

  if (existing) {
    return updateInventoryLevelSql(context, itemId, input.location_id, input)
  }

  const schemaQ = quoteSchema(schema)
  const id = generateEntityId(undefined, "ilev")
  const stocked = parseQuantity(input.stocked_quantity)
  const incoming = parseQuantity(input.incoming_quantity)

  await getPlatformPool().query(
    `insert into ${schemaQ}.inventory_level (
       id, inventory_item_id, location_id, stocked_quantity, reserved_quantity,
       incoming_quantity, raw_stocked_quantity, raw_reserved_quantity,
       raw_incoming_quantity, created_at, updated_at
     ) values (
       $1, $2, $3, $4, 0, $5, $6::jsonb, $7::jsonb, $8::jsonb, now(), now()
     )`,
    [
      id,
      itemId,
      input.location_id,
      stocked,
      incoming,
      rawQuantity(stocked),
      rawQuantity(0),
      rawQuantity(incoming),
    ]
  )

  return loadInventoryLevelByLocation(schema, itemId, input.location_id)
}

async function updateInventoryLevelSql(
  context: CatalogSchemaContext,
  itemId: string,
  locationId: string,
  input: { stocked_quantity?: number; incoming_quantity?: number }
) {
  const schema = context.catalogSchema
  const existing = await loadInventoryLevelByLocation(schema, itemId, locationId)

  if (!existing) {
    return createInventoryLevelSql(context, itemId, {
      location_id: locationId,
      stocked_quantity: input.stocked_quantity,
      incoming_quantity: input.incoming_quantity,
    })
  }

  const schemaQ = quoteSchema(schema)
  const stocked =
    input.stocked_quantity !== undefined
      ? parseQuantity(input.stocked_quantity)
      : Number(existing.stocked_quantity ?? 0)
  const incoming =
    input.incoming_quantity !== undefined
      ? parseQuantity(input.incoming_quantity)
      : Number(existing.incoming_quantity ?? 0)
  const reserved = Number(existing.reserved_quantity ?? 0)

  await getPlatformPool().query(
    `update ${schemaQ}.inventory_level
     set stocked_quantity = $3,
         incoming_quantity = $4,
         raw_stocked_quantity = $5::jsonb,
         raw_incoming_quantity = $6::jsonb,
         updated_at = now()
     where inventory_item_id = $1
       and location_id = $2
       and deleted_at is null`,
    [
      itemId,
      locationId,
      stocked,
      incoming,
      rawQuantity(stocked),
      rawQuantity(incoming),
    ]
  )

  return loadInventoryLevelByLocation(schema, itemId, locationId)
}

async function deleteInventoryLevelSql(
  schema: string,
  levelId: string
): Promise<boolean> {
  const schemaQ = quoteSchema(schema)
  const result = await getPlatformPool().query(
    `update ${schemaQ}.inventory_level
     set deleted_at = now(), updated_at = now()
     where id = $1 and deleted_at is null`,
    [levelId]
  )

  return (result.rowCount ?? 0) > 0
}

async function deleteInventoryLevelByLocationSql(
  schema: string,
  itemId: string,
  locationId: string
): Promise<boolean> {
  const schemaQ = quoteSchema(schema)
  const result = await getPlatformPool().query(
    `update ${schemaQ}.inventory_level
     set deleted_at = now(), updated_at = now()
     where inventory_item_id = $1
       and location_id = $2
       and deleted_at is null`,
    [itemId, locationId]
  )

  return (result.rowCount ?? 0) > 0
}

async function createInventoryItemSql(
  context: CatalogSchemaContext,
  input: CreateInventoryItemInput
) {
  const schema = context.catalogSchema
  const schemaQ = quoteSchema(schema)
  const id = generateEntityId(undefined, "iitem")

  await getPlatformPool().query(
    `insert into ${schemaQ}.inventory_item (
       id, sku, origin_country, hs_code, mid_code, material, weight, length, height,
       width, requires_shipping, description, title, thumbnail, metadata,
       created_at, updated_at
     ) values (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, now(), now()
     )`,
    [
      id,
      input.sku ?? null,
      input.origin_country ?? null,
      input.hs_code ?? null,
      input.mid_code ?? null,
      input.material ?? null,
      input.weight ?? null,
      input.length ?? null,
      input.height ?? null,
      input.width ?? null,
      input.requires_shipping ?? true,
      input.description ?? null,
      input.title ?? null,
      input.thumbnail ?? null,
      input.metadata ?? null,
    ]
  )

  for (const level of input.location_levels ?? []) {
    await createInventoryLevelSql(context, id, level)
  }

  return loadTenantInventoryItem(schema, id)
}

async function updateInventoryItemSql(
  schema: string,
  id: string,
  input: UpdateInventoryItemInput
) {
  await assertInventoryItemExists(schema, id)

  const fields: string[] = []
  const values: unknown[] = [id]
  let index = 2

  const assign = (column: string, value: unknown) => {
    fields.push(`${column} = $${index}`)
    values.push(value)
    index += 1
  }

  if (input.sku !== undefined) assign("sku", input.sku)
  if (input.origin_country !== undefined) assign("origin_country", input.origin_country)
  if (input.hs_code !== undefined) assign("hs_code", input.hs_code)
  if (input.mid_code !== undefined) assign("mid_code", input.mid_code)
  if (input.material !== undefined) assign("material", input.material)
  if (input.weight !== undefined) assign("weight", input.weight)
  if (input.length !== undefined) assign("length", input.length)
  if (input.height !== undefined) assign("height", input.height)
  if (input.width !== undefined) assign("width", input.width)
  if (input.requires_shipping !== undefined) {
    assign("requires_shipping", input.requires_shipping)
  }
  if (input.description !== undefined) assign("description", input.description)
  if (input.title !== undefined) assign("title", input.title)
  if (input.thumbnail !== undefined) assign("thumbnail", input.thumbnail)
  if (input.metadata !== undefined) assign("metadata", input.metadata)

  if (fields.length > 0) {
    const schemaQ = quoteSchema(schema)
    await getPlatformPool().query(
      `update ${schemaQ}.inventory_item
       set ${fields.join(", ")}, updated_at = now()
       where id = $1 and deleted_at is null`,
      values
    )
  }

  return loadTenantInventoryItem(schema, id)
}

async function deleteInventoryItemSql(schema: string, id: string) {
  await assertInventoryItemExists(schema, id)
  const schemaQ = quoteSchema(schema)

  await getPlatformPool().query(
    `update ${schemaQ}.inventory_level
     set deleted_at = now(), updated_at = now()
     where inventory_item_id = $1 and deleted_at is null`,
    [id]
  )

  await getPlatformPool().query(
    `update ${schemaQ}.inventory_item
     set deleted_at = now(), updated_at = now()
     where id = $1 and deleted_at is null`,
    [id]
  )
}

async function runBatchInventoryLevels(
  context: CatalogSchemaContext,
  itemId: string | undefined,
  body: {
    create?: BatchLevelCreate[]
    update?: BatchLevelUpdate[]
    delete?: string[]
    force?: boolean
  }
) {
  const schema = context.catalogSchema
  const created: InventoryLevelRow[] = []
  const updated: InventoryLevelRow[] = []
  const deleted: string[] = []

  for (const entry of body.create ?? []) {
    const inventoryItemId = itemId ?? entry.inventory_item_id
    if (!inventoryItemId) {
      continue
    }

    await assertInventoryItemExists(schema, inventoryItemId)
    const row = await createInventoryLevelSql(context, inventoryItemId, entry)
    if (row) {
      created.push(row)
    }
  }

  for (const entry of body.update ?? []) {
    const inventoryItemId = itemId ?? entry.inventory_item_id
    if (!inventoryItemId) {
      continue
    }

    await assertInventoryItemExists(schema, inventoryItemId)
    const row = await updateInventoryLevelSql(
      context,
      inventoryItemId,
      entry.location_id,
      entry
    )
    if (row) {
      updated.push(row)
    }
  }

  for (const levelId of body.delete ?? []) {
    const schemaQ = quoteSchema(schema)
    const existing = await getPlatformPool().query<InventoryLevelRow>(
      `select id, inventory_item_id, location_id, stocked_quantity, reserved_quantity,
              incoming_quantity, raw_stocked_quantity, raw_reserved_quantity,
              raw_incoming_quantity, metadata, created_at, updated_at, deleted_at
       from ${schemaQ}.inventory_level
       where id = $1 and deleted_at is null`,
      [levelId]
    )

    const row = existing.rows[0]
    if (!row) {
      continue
    }

    if (itemId && row.inventory_item_id !== itemId) {
      continue
    }

    if (!body.force && Number(row.reserved_quantity ?? 0) > 0) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Cannot delete inventory level ${levelId} with reserved quantity`
      )
    }

    if (await deleteInventoryLevelSql(schema, levelId)) {
      deleted.push(levelId)
    }
  }

  return {
    created: created.map(mapInventoryLevel),
    updated: updated.map(mapInventoryLevel),
    deleted,
  }
}

function readQueryString(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) {
    return undefined
  }

  return value.trim()
}

export async function tenantAdminInventoryItemsListShim(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    const context = await resolveCatalogSchemaContext(req)
    if (!context) {
      next()
      return
    }

    const limit = Math.min(Number(req.query.limit ?? 20) || 20, 100)
    const offset = Number(req.query.offset ?? 0) || 0
    const q = readQueryString(req.query.q)
    const id = readQueryString(req.query.id)
    const sku = readQueryString(req.query.sku)

    let locationId: string | undefined
    const locationLevels = req.query.location_levels
    if (
      locationLevels &&
      typeof locationLevels === "object" &&
      !Array.isArray(locationLevels)
    ) {
      const nested = (locationLevels as { location_id?: unknown }).location_id
      locationId = readQueryString(nested)
    }

    const result = await loadInventoryItemsList(context.catalogSchema, {
      limit,
      offset,
      q,
      id,
      sku,
      locationId,
    })

    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function tenantAdminInventoryItemByIdGetShim(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    const context = await resolveCatalogSchemaContext(req)
    if (!context) {
      next()
      return
    }

    const id = req.params.id
    if (!id) {
      next()
      return
    }

    const inventory_item = await loadTenantInventoryItem(context.catalogSchema, id)
    if (!inventory_item) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Inventory item with id: ${id} was not found`
      )
    }

    res.json({ inventory_item })
  } catch (error) {
    next(error)
  }
}

export async function tenantAdminInventoryItemLocationLevelsGetShim(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    const context = await resolveCatalogSchemaContext(req)
    if (!context) {
      next()
      return
    }
    const schema = context.catalogSchema

    const id = req.params.id
    if (!id) {
      next()
      return
    }

    await assertInventoryItemExists(schema, id)

    const limit = Math.min(Number(req.query.limit ?? 50) || 50, 100)
    const offset = Number(req.query.offset ?? 0) || 0
    const locationId = readQueryString(req.query.location_id)
    const levels = await loadInventoryLevelRows(schema, id)
    const filtered = locationId
      ? levels.filter((level) => level.location_id === locationId)
      : levels
    const inventory_levels = filtered
      .slice(offset, offset + limit)
      .map(mapInventoryLevel)

    res.json({
      inventory_levels,
      count: filtered.length,
      offset,
      limit,
    })
  } catch (error) {
    next(error)
  }
}

export async function tenantAdminInventoryItemsPostShim(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    const context = await resolveCatalogSchemaContext(req)
    if (!context) {
      next()
      return
    }
    const schema = context.catalogSchema

    const body = (req.body ?? {}) as CreateInventoryItemInput
    const inventory_item = await createInventoryItemSql(context, body)
    res.status(200).json({ inventory_item })
  } catch (error) {
    next(error)
  }
}

export async function tenantAdminInventoryItemByIdPostShim(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    const context = await resolveCatalogSchemaContext(req)
    if (!context) {
      next()
      return
    }
    const schema = context.catalogSchema

    const id = req.params.id
    if (!id) {
      next()
      return
    }

    const body = (req.body ?? {}) as UpdateInventoryItemInput
    const inventory_item = await updateInventoryItemSql(schema, id, body)
    res.status(200).json({ inventory_item })
  } catch (error) {
    next(error)
  }
}

export async function tenantAdminInventoryItemByIdDeleteShim(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    const context = await resolveCatalogSchemaContext(req)
    if (!context) {
      next()
      return
    }
    const schema = context.catalogSchema

    const id = req.params.id
    if (!id) {
      next()
      return
    }

    await deleteInventoryItemSql(schema, id)
    res.status(200).json({ id, object: "inventory_item", deleted: true })
  } catch (error) {
    next(error)
  }
}

export async function tenantAdminInventoryItemLocationLevelsPostShim(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    const context = await resolveCatalogSchemaContext(req)
    if (!context) {
      next()
      return
    }
    const schema = context.catalogSchema

    const id = req.params.id
    if (!id) {
      next()
      return
    }

    await assertInventoryItemExists(schema, id)
    const body = (req.body ?? {}) as LocationLevelInput
    await createInventoryLevelSql(context, id, body)
    const inventory_item = await loadTenantInventoryItem(schema, id)
    res.status(200).json({ inventory_item })
  } catch (error) {
    next(error)
  }
}

export async function tenantAdminInventoryItemLocationLevelByLocationPostShim(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    const context = await resolveCatalogSchemaContext(req)
    if (!context) {
      next()
      return
    }
    const schema = context.catalogSchema

    const id = req.params.id
    const locationId = req.params.location_id
    if (!id || !locationId) {
      next()
      return
    }

    await assertInventoryItemExists(schema, id)
    const body = (req.body ?? {}) as {
      stocked_quantity?: number
      incoming_quantity?: number
    }
    await updateInventoryLevelSql(context, id, locationId, body)
    const inventory_item = await loadTenantInventoryItem(schema, id)
    res.status(200).json({ inventory_item })
  } catch (error) {
    next(error)
  }
}

export async function tenantAdminInventoryItemLocationLevelDeleteShim(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    const context = await resolveCatalogSchemaContext(req)
    if (!context) {
      next()
      return
    }
    const schema = context.catalogSchema

    const id = req.params.id
    const locationId = req.params.location_id
    if (!id || !locationId) {
      next()
      return
    }

    await assertInventoryItemExists(schema, id)
    const deleted = await deleteInventoryLevelByLocationSql(schema, id, locationId)

    if (!deleted) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Item ${id} is not stocked at location ${locationId}`
      )
    }

    const inventory_item = await loadTenantInventoryItem(schema, id)
    res.status(200).json({ inventory_item })
  } catch (error) {
    next(error)
  }
}

export async function tenantAdminInventoryItemLocationLevelsBatchPostShim(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    const context = await resolveCatalogSchemaContext(req)
    if (!context) {
      next()
      return
    }
    const schema = context.catalogSchema

    const id = req.params.id
    if (!id) {
      next()
      return
    }

    const body = (req.body ?? {}) as {
      create?: BatchLevelCreate[]
      update?: BatchLevelUpdate[]
      delete?: string[]
      force?: boolean
    }

    const result = await runBatchInventoryLevels(context, id, body)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export async function tenantAdminInventoryLocationLevelsBatchPostShim(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    const context = await resolveCatalogSchemaContext(req)
    if (!context) {
      next()
      return
    }
    const schema = context.catalogSchema

    const body = (req.body ?? {}) as {
      create?: BatchLevelCreate[]
      update?: BatchLevelUpdate[]
      delete?: string[]
      force?: boolean
    }

    const result = await runBatchInventoryLevels(context, undefined, body)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}
