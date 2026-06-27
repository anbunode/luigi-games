import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { getAuthContextFromJwtToken } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { getPlatformPool } from "./platform-db"
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

    const result = await getPlatformPool().query(
      `select
         id, name, default_sales_channel_id, default_region_id, default_location_id,
         metadata, created_at, updated_at
       from ${quoteSchema(schema)}.store
       where deleted_at is null
       order by created_at asc`
    )

    res.json({
      stores: result.rows,
      count: result.rows.length,
      offset: 0,
      limit: result.rows.length,
    })
  } catch (error) {
    next(error)
  }
}

export async function tenantAdminRegionsShim(
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
         id, name, currency_code, automatic_taxes, metadata, created_at, updated_at
       from ${quoteSchema(schema)}.region
       where deleted_at is null
       order by created_at asc`
    )

    res.json({
      regions: result.rows,
      count: result.rows.length,
      offset: 0,
      limit: result.rows.length,
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
