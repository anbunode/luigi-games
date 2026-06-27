import type { MedusaRequest } from "@medusajs/framework/http"
import { getPlatformPool } from "./platform-db"

export type SkrepayTenant = {
  id: string
  slug: string
  display_name: string
  owner_email: string | null
  medusa_user_id: string | null
  medusa_sales_channel_id: string | null
  storefront_url: string | null
  free_subdomain: string | null
  custom_domain: string | null
  database_url: string | null
  database_schema: string | null
  database_status: string
}

type TenantRow = SkrepayTenant

function mapTenant(row: TenantRow): SkrepayTenant {
  return row
}

export function getAuthUserId(req: MedusaRequest): string | null {
  const authContext = (
    req as MedusaRequest & {
      auth_context?: { actor_id?: string; actor_type?: string }
    }
  ).auth_context

  if (!authContext?.actor_id || authContext.actor_type !== "user") {
    return null
  }

  return authContext.actor_id
}

export async function getTenantByUserId(
  userId: string
): Promise<SkrepayTenant | null> {
  const db = getPlatformPool()
  const result = await db.query<TenantRow>(
    `select
       id, slug, display_name, owner_email, medusa_user_id,
       medusa_sales_channel_id, storefront_url, free_subdomain,
       custom_domain, database_url, database_schema, database_status
     from public.skrepayshop_tenants
     where medusa_user_id = $1
     limit 1`,
    [userId]
  )

  return result.rows[0] ? mapTenant(result.rows[0]) : null
}

export async function getTenantByEmail(
  email: string
): Promise<SkrepayTenant | null> {
  const db = getPlatformPool()
  const result = await db.query<TenantRow>(
    `select
       id, slug, display_name, owner_email, medusa_user_id,
       medusa_sales_channel_id, storefront_url, free_subdomain,
       custom_domain, database_url, database_schema, database_status
     from public.skrepayshop_tenants
     where lower(owner_email) = lower($1)
     limit 1`,
    [email.trim()]
  )

  return result.rows[0] ? mapTenant(result.rows[0]) : null
}

export async function getTenantBySlug(
  slug: string
): Promise<SkrepayTenant | null> {
  const db = getPlatformPool()
  const result = await db.query<TenantRow>(
    `select
       id, slug, display_name, owner_email, medusa_user_id,
       medusa_sales_channel_id, storefront_url, free_subdomain,
       custom_domain, database_url, database_schema, database_status
     from public.skrepayshop_tenants
     where slug = $1
     limit 1`,
    [slug]
  )

  return result.rows[0] ? mapTenant(result.rows[0]) : null
}

export async function requireTenantFromRequest(
  req: MedusaRequest
): Promise<SkrepayTenant> {
  const userId = getAuthUserId(req)

  if (!userId) {
    throw new Error("Unauthorized")
  }

  const tenant = await getTenantByUserId(userId)

  if (!tenant) {
    throw new Error("No SkrepayShop tenant linked to this admin user")
  }

  return tenant
}

export function resolveTenantSlugFromRequest(req: MedusaRequest): string | null {
  const header = req.headers["x-skrepay-tenant"]
  const fromHeader = Array.isArray(header) ? header[0] : header

  if (typeof fromHeader === "string" && fromHeader.trim()) {
    return fromHeader.trim().toLowerCase()
  }

  const query = req.query as { tenant_slug?: string }
  if (typeof query.tenant_slug === "string" && query.tenant_slug.trim()) {
    return query.tenant_slug.trim().toLowerCase()
  }

  return null
}

export async function resolveStoreTenant(
  req: MedusaRequest
): Promise<SkrepayTenant | null> {
  const slug = resolveTenantSlugFromRequest(req)

  if (!slug) {
    return null
  }

  return getTenantBySlug(slug)
}
