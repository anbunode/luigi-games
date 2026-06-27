import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { getAuthContextFromJwtToken } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { getPlatformPool } from "./platform-db"
import { getAdminRequestPath } from "./request-path"

type ScopedRequest = MedusaRequest & {
  skrepayTenantSchema?: string
}

function quoteSchema(schema: string): string {
  return `"${schema.replace(/"/g, '""')}"`
}

function readActorId(req: MedusaRequest): string | null {
  const sessionContext = (
    req as MedusaRequest & {
      session?: { auth_context?: { actor_id?: string; actor_type?: string } }
    }
  ).session?.auth_context

  if (sessionContext?.actor_id && sessionContext.actor_type === "user") {
    return sessionContext.actor_id
  }

  if (req.auth_context?.actor_id && req.auth_context.actor_type === "user") {
    return req.auth_context.actor_id
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

async function handleUsersMe(
  req: MedusaRequest,
  res: MedusaResponse,
  schema: string
) {
  const id = readActorId(req)

  if (!id) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "User ID not found")
  }

  const result = await getPlatformPool().query(
    `select
       id, email, first_name, last_name, avatar_url, metadata, created_at, updated_at
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
}

async function handleStores(
  res: MedusaResponse,
  schema: string
) {
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
}

async function handleRegions(
  res: MedusaResponse,
  schema: string
) {
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
}

async function handleSalesChannels(
  res: MedusaResponse,
  schema: string
) {
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
}

export async function tenantAdminShimMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    const schema = (req as ScopedRequest).skrepayTenantSchema

    if (!schema || req.method !== "GET") {
      next()
      return
    }

    const path = getAdminRequestPath(req)

    if (path === "/admin/users/me") {
      await handleUsersMe(req, res, schema)
      return
    }

    if (path === "/admin/stores") {
      await handleStores(res, schema)
      return
    }

    if (path === "/admin/regions") {
      await handleRegions(res, schema)
      return
    }

    if (path === "/admin/sales-channels") {
      await handleSalesChannels(res, schema)
      return
    }

    next()
  } catch (error) {
    next(error)
  }
}
