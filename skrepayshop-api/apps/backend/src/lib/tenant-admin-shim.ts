import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { getAuthContextFromJwtToken } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError, generateEntityId } from "@medusajs/framework/utils"
import { getPlatformPool } from "./platform-db"
import {
  loadStoreEnabledCurrenciesForAdmin,
  loadMasterCurrencyCatalog,
  syncStoreSupportedCurrencies,
  type StoreCurrencyInput,
} from "./tenant-store-currencies"
import {
  resolveTenantForAdminRequest,
  resolveTenantSchema,
} from "./tenant-db-scope"

type ScopedRequest = MedusaRequest & {
  skrepayTenantSchema?: string
  auth_context?: { actor_id?: string; actor_type?: string }
  session?: { auth_context?: { actor_id?: string; actor_type?: string } }
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

function readActorId(req: MedusaRequest): string | null {
  const scopedReq = req as ScopedRequest
  const sessionContext = scopedReq.session?.auth_context

  if (sessionContext?.actor_id && sessionContext.actor_type === "user") {
    return sessionContext.actor_id
  }

  if (scopedReq.auth_context?.actor_id && scopedReq.auth_context.actor_type === "user") {
    return scopedReq.auth_context.actor_id
  }

  const authorization = req.headers.authorization

  if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) {
    return null
  }

  const config = req.scope.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
  const { http } = config.projectConfig

  if (!http.jwtSecret) {
    return null
  }

  const authContext = getAuthContextFromJwtToken(
    authorization,
    http.jwtSecret,
    ["bearer"],
    ["user"],
    http.jwtPublicKey,
    http.jwtVerifyOptions ?? http.jwtOptions
  )

  return authContext?.actor_id ?? null
}

export async function tenantAdminUsersMeShim(
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

    const id = readActorId(req)

    if (!id) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "User ID not found")
    }

    const result = await getPlatformPool().query(
      `select id, email, first_name, last_name, created_at, updated_at
       from ${quoteSchema(schema)}."user"
       where id = $1 and deleted_at is null`,
      [id]
    )

    const user = result.rows[0]

    if (!user) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `User with id: ${id} was not found`
      )
    }

    res.status(200).json({ user })
  } catch (error) {
    next(error)
  }
}

async function attachSupportedCurrencies<T extends { id: string }>(
  schema: string,
  stores: T[]
) {
  const byStore = new Map<
    string,
    Awaited<ReturnType<typeof loadStoreEnabledCurrenciesForAdmin>>
  >()

  for (const store of stores) {
    byStore.set(
      store.id,
      await loadStoreEnabledCurrenciesForAdmin(schema, store.id)
    )
  }

  return stores.map((row) => ({
    ...row,
    supported_currencies: byStore.get(row.id) ?? [],
  }))
}

async function loadStoreRows(schema: string, storeId?: string) {
  const params: string[] = []
  let where = "deleted_at is null"

  if (storeId) {
    where += " and id = $1"
    params.push(storeId)
  }

  const result = await getPlatformPool().query(
    `select
       id, name, default_sales_channel_id, default_region_id, default_location_id,
       metadata, created_at, updated_at
     from ${quoteSchema(schema)}.store
     where ${where}
     order by created_at asc`,
    params
  )

  return result.rows as Array<{
    id: string
    name: string
    default_sales_channel_id: string | null
    default_region_id: string | null
    default_location_id: string | null
    metadata: Record<string, unknown> | null
    created_at: Date
    updated_at: Date
  }>
}

export async function tenantAdminStoreByIdGetShim(
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

    const rows = await loadStoreRows(schema, id)
    const store = rows[0]

    if (!store) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Store with id: ${id} was not found`
      )
    }

    const [fullStore] = await attachSupportedCurrencies(schema, [store])
    res.json({ store: fullStore })
  } catch (error) {
    next(error)
  }
}

type StoreUpdateBody = {
  name?: string
  default_sales_channel_id?: string | null
  default_region_id?: string | null
  default_location_id?: string | null
  metadata?: Record<string, unknown> | null
  supported_currencies?: StoreCurrencyInput[]
}

export async function tenantAdminStoreByIdPostShim(
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

    const rows = await loadStoreRows(schema, id)
    const store = rows[0]

    if (!store) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Store with id: ${id} was not found`
      )
    }

    const body = req.body as StoreUpdateBody
    const schemaQ = quoteSchema(schema)
    const updates: string[] = []
    const values: unknown[] = []

    if (body.name !== undefined) {
      values.push(body.name)
      updates.push(`name = $${values.length}`)
    }

    if (body.default_sales_channel_id !== undefined) {
      values.push(body.default_sales_channel_id)
      updates.push(`default_sales_channel_id = $${values.length}`)
    }

    if (body.default_region_id !== undefined) {
      values.push(body.default_region_id)
      updates.push(`default_region_id = $${values.length}`)
    }

    if (body.default_location_id !== undefined) {
      values.push(body.default_location_id)
      updates.push(`default_location_id = $${values.length}`)
    }

    if (body.metadata !== undefined) {
      values.push(JSON.stringify(body.metadata))
      updates.push(`metadata = $${values.length}::jsonb`)
    }

    if (updates.length > 0) {
      values.push(id)
      await getPlatformPool().query(
        `update ${schemaQ}.store
         set ${updates.join(", ")}, updated_at = now()
         where id = $${values.length} and deleted_at is null`,
        values
      )
    }

    if (body.supported_currencies !== undefined) {
      await syncStoreSupportedCurrencies(
        schema,
        id,
        body.supported_currencies ?? []
      )
    }

    const updatedRows = await loadStoreRows(schema, id)
    const [fullStore] = await attachSupportedCurrencies(schema, updatedRows)
    res.json({ store: fullStore })
  } catch (error) {
    next(error)
  }
}

export async function tenantAdminStoresShim(
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

    const rows = await loadStoreRows(schema)
    const stores = await attachSupportedCurrencies(schema, rows)

    res.json({
      stores,
      count: stores.length,
      offset: 0,
      limit: stores.length,
    })
  } catch (error) {
    next(error)
  }
}

export async function tenantAdminSalesChannelsShim(
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

    const result = await getPlatformPool().query(
      `select
         id, name, description, is_disabled, metadata, created_at, updated_at
       from ${quoteSchema(schema)}.sales_channel
       where deleted_at is null
       order by created_at asc`
    )

    res.json({
      sales_channels: result.rows,
      count: result.rows.length,
      offset: 0,
      limit: result.rows.length,
    })
  } catch (error) {
    next(error)
  }
}

export async function tenantAdminSalesChannelByIdGetShim(
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

    const result = await getPlatformPool().query(
      `select
         id, name, description, is_disabled, metadata, created_at, updated_at
       from ${quoteSchema(schema)}.sales_channel
       where id = $1 and deleted_at is null`,
      [id]
    )

    const sales_channel = result.rows[0]

    if (!sales_channel) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Sales channel with id: ${id} was not found`
      )
    }

    res.json({ sales_channel })
  } catch (error) {
    next(error)
  }
}

export async function tenantAdminCurrenciesShim(
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

    const rows = await loadMasterCurrencyCatalog(schema)

    res.json({
      currencies: rows,
      count: rows.length,
      offset: 0,
      limit: rows.length,
    })
  } catch (error) {
    next(error)
  }
}

function parseQueryList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => String(entry).split(",")).map((v) => v.trim()).filter(Boolean)
  }
  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((v) => v.trim()).filter(Boolean)
  }
  return []
}

export async function tenantAdminPricePreferencesShim(
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

    const attribute =
      typeof req.query.attribute === "string" ? req.query.attribute : undefined
    const values = parseQueryList(req.query.value)
    const schemaQ = quoteSchema(schema)

    const conditions: string[] = ["deleted_at is null"]
    const params: unknown[] = []

    if (attribute) {
      params.push(attribute)
      conditions.push(`attribute = $${params.length}`)
    }

    if (values.length > 0) {
      params.push(values)
      conditions.push(`value = any($${params.length}::text[])`)
    }

    const result = await getPlatformPool().query(
      `select id, attribute, value, is_tax_inclusive, created_at, updated_at, deleted_at
       from ${schemaQ}.price_preference
       where ${conditions.join(" and ")}
       order by created_at asc`,
      params
    )

    res.json({
      price_preferences: result.rows,
      count: result.rows.length,
      offset: 0,
      limit: result.rows.length,
    })
  } catch (error) {
    next(error)
  }
}

type PricePreferenceRow = {
  id: string
  attribute: string
  value: string
  is_tax_inclusive: boolean
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

async function loadPricePreferenceRow(
  schema: string,
  id: string
): Promise<PricePreferenceRow | null> {
  const result = await getPlatformPool().query<PricePreferenceRow>(
    `select id, attribute, value, is_tax_inclusive, created_at, updated_at, deleted_at
     from ${quoteSchema(schema)}.price_preference
     where id = $1 and deleted_at is null`,
    [id]
  )

  return result.rows[0] ?? null
}

async function findPricePreferenceByAttributeValue(
  schema: string,
  attribute: string,
  value: string
): Promise<PricePreferenceRow | null> {
  const result = await getPlatformPool().query<PricePreferenceRow>(
    `select id, attribute, value, is_tax_inclusive, created_at, updated_at, deleted_at
     from ${quoteSchema(schema)}.price_preference
     where attribute = $1 and lower(value) = lower($2) and deleted_at is null
     limit 1`,
    [attribute, value]
  )

  return result.rows[0] ?? null
}

export async function tenantAdminPricePreferenceByIdGetShim(
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

    const price_preference = await loadPricePreferenceRow(schema, id)

    if (!price_preference) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Price preference with id: ${id} was not found`
      )
    }

    res.json({ price_preference })
  } catch (error) {
    next(error)
  }
}

type PricePreferenceCreateBody = {
  attribute?: string
  value?: string
  is_tax_inclusive?: boolean
}

type PricePreferenceUpdateBody = {
  attribute?: string
  value?: string
  is_tax_inclusive?: boolean
}

export async function tenantAdminPricePreferencesPostShim(
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

    const body = req.body as PricePreferenceCreateBody
    const attribute = body.attribute
    const value = body.value

    if (!attribute || !value) {
      next()
      return
    }

    const existing = await findPricePreferenceByAttributeValue(
      schema,
      attribute,
      value
    )

    if (existing) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Price preference with attribute: ${attribute}, value: ${value}, already exists.`
      )
    }

    const schemaQ = quoteSchema(schema)
    const id = generateEntityId(undefined, "ppref")

    await getPlatformPool().query(
      `insert into ${schemaQ}.price_preference
         (id, attribute, value, is_tax_inclusive, created_at, updated_at)
       values ($1, $2, $3, $4, now(), now())`,
      [id, attribute, value, body.is_tax_inclusive ?? false]
    )

    const price_preference = await loadPricePreferenceRow(schema, id)
    res.json({ price_preference })
  } catch (error) {
    next(error)
  }
}

export async function tenantAdminPricePreferenceByIdPostShim(
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

    const existing = await loadPricePreferenceRow(schema, id)

    if (!existing) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Price preference with id: ${id} was not found`
      )
    }

    const body = req.body as PricePreferenceUpdateBody
    const schemaQ = quoteSchema(schema)
    const updates: string[] = []
    const values: unknown[] = []

    if (body.attribute !== undefined) {
      values.push(body.attribute)
      updates.push(`attribute = $${values.length}`)
    }

    if (body.value !== undefined) {
      values.push(body.value)
      updates.push(`value = $${values.length}`)
    }

    if (body.is_tax_inclusive !== undefined) {
      values.push(body.is_tax_inclusive)
      updates.push(`is_tax_inclusive = $${values.length}`)
    }

    if (updates.length > 0) {
      values.push(id)
      await getPlatformPool().query(
        `update ${schemaQ}.price_preference
         set ${updates.join(", ")}, updated_at = now()
         where id = $${values.length} and deleted_at is null`,
        values
      )
    }

    const price_preference = await loadPricePreferenceRow(schema, id)
    res.json({ price_preference })
  } catch (error) {
    next(error)
  }
}

export async function tenantAdminPricePreferenceByIdDeleteShim(
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

    const existing = await loadPricePreferenceRow(schema, id)

    if (!existing) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Price preference with id: ${id} was not found`
      )
    }

    await getPlatformPool().query(
      `update ${quoteSchema(schema)}.price_preference
       set deleted_at = now(), updated_at = now()
       where id = $1 and deleted_at is null`,
      [id]
    )

    res.json({
      id,
      object: "price_preference",
      deleted: true,
    })
  } catch (error) {
    next(error)
  }
}
