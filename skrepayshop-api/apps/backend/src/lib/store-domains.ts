import { getPlatformPool } from "./platform-db"

function normalizeDomainName(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "")
}

function domainToStorefrontUrl(domain: string): string {
  const normalized = normalizeDomainName(domain)
  if (!normalized) {
    return ""
  }
  return `https://${normalized}`
}

export type StoreDomainStatus = "pending" | "verifying" | "active" | "failed"

export type StoreDomain = {
  id: string
  tenant_id: string
  domain_name: string
  is_primary: boolean
  status: StoreDomainStatus
  is_cloudflare_automated: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

type StoreDomainRow = StoreDomain

function mapRow(row: StoreDomainRow): StoreDomain {
  return {
    ...row,
    metadata: row.metadata ?? {},
  }
}

export async function listDomainsForTenant(
  tenantId: string
): Promise<StoreDomain[]> {
  const db = getPlatformPool()
  const result = await db.query<StoreDomainRow>(
    `select *
     from public.skrepayshop_store_domains
     where tenant_id = $1
     order by is_primary desc, created_at asc`,
    [tenantId]
  )

  return result.rows.map(mapRow)
}

export async function getPrimaryDomain(
  tenantId: string
): Promise<StoreDomain | null> {
  const db = getPlatformPool()
  const result = await db.query<StoreDomainRow>(
    `select *
     from public.skrepayshop_store_domains
     where tenant_id = $1 and is_primary = true
     limit 1`,
    [tenantId]
  )

  return result.rows[0] ? mapRow(result.rows[0]) : null
}

export async function getPrimaryStorefrontUrl(
  tenantId: string
): Promise<string | null> {
  const primary = await getPrimaryDomain(tenantId)

  if (!primary) {
    return null
  }

  return domainToStorefrontUrl(primary.domain_name)
}

export async function createDomain(
  tenantId: string,
  domainInput: string,
  options?: { is_cloudflare_automated?: boolean }
): Promise<StoreDomain> {
  const domain_name = normalizeDomainName(domainInput)

  if (!domain_name) {
    throw new Error("Introduce un dominio válido")
  }

  if (domain_name.endsWith(".skrepay.shop")) {
    throw new Error("El subdominio .skrepay.shop se asigna automáticamente")
  }

  const db = getPlatformPool()
  const existing = await listDomainsForTenant(tenantId)
  const hasPrimary = existing.some((domain) => domain.is_primary)

  const result = await db.query<StoreDomainRow>(
    `insert into public.skrepayshop_store_domains (
       tenant_id, domain_name, is_primary, status, is_cloudflare_automated
     ) values ($1, $2, $3, 'pending', $4)
     returning *`,
    [
      tenantId,
      domain_name,
      !hasPrimary,
      Boolean(options?.is_cloudflare_automated),
    ]
  )

  const created = mapRow(result.rows[0])

  if (created.is_primary) {
    await syncTenantCustomDomain(tenantId, created.domain_name)
  }

  return created
}

export async function ensureFreeSubdomain(
  tenantId: string,
  slug: string
): Promise<StoreDomain> {
  const domain_name = `${slug}.skrepay.shop`
  const db = getPlatformPool()

  const existing = await db.query<StoreDomainRow>(
    `select * from public.skrepayshop_store_domains
     where tenant_id = $1 and domain_name = $2
     limit 1`,
    [tenantId, domain_name]
  )

  if (existing.rows[0]) {
    return mapRow(existing.rows[0])
  }

  const result = await db.query<StoreDomainRow>(
    `insert into public.skrepayshop_store_domains (
       tenant_id, domain_name, is_primary, status, is_cloudflare_automated
     ) values ($1, $2, true, 'active', false)
     returning *`,
    [tenantId, domain_name]
  )

  await db.query(
    `update public.skrepayshop_tenants
     set free_subdomain = $2, storefront_url = $3, updated_at = now()
     where id = $1`,
    [tenantId, domain_name, domainToStorefrontUrl(domain_name)]
  )

  return mapRow(result.rows[0])
}

export async function setPrimaryDomain(
  tenantId: string,
  domainId: string
): Promise<StoreDomain> {
  const db = getPlatformPool()

  const row = await db.query<StoreDomainRow>(
    `select * from public.skrepayshop_store_domains
     where id = $1 and tenant_id = $2
     limit 1`,
    [domainId, tenantId]
  )

  const domain = row.rows[0]

  if (!domain) {
    throw new Error("Dominio no encontrado")
  }

  if (domain.status !== "active") {
    throw new Error("Solo puedes marcar como principal un dominio activo")
  }

  await db.query(
    `update public.skrepayshop_store_domains
     set is_primary = false, updated_at = now()
     where tenant_id = $1`,
    [tenantId]
  )

  const updated = await db.query<StoreDomainRow>(
    `update public.skrepayshop_store_domains
     set is_primary = true, updated_at = now()
     where id = $1
     returning *`,
    [domainId]
  )

  const primary = mapRow(updated.rows[0])
  await syncTenantCustomDomain(tenantId, primary.domain_name)

  return primary
}

export async function markDomainVerifying(
  tenantId: string,
  domainId: string
): Promise<StoreDomain> {
  const db = getPlatformPool()
  const result = await db.query<StoreDomainRow>(
    `update public.skrepayshop_store_domains
     set status = 'verifying', updated_at = now()
     where id = $1 and tenant_id = $2
     returning *`,
    [domainId, tenantId]
  )

  if (!result.rows[0]) {
    throw new Error("Dominio no encontrado")
  }

  return mapRow(result.rows[0])
}

export async function verifyDomain(
  tenantId: string,
  domainId: string
): Promise<StoreDomain> {
  const db = getPlatformPool()
  const result = await db.query<StoreDomainRow>(
    `update public.skrepayshop_store_domains
     set status = 'active', updated_at = now()
     where id = $1 and tenant_id = $2
     returning *`,
    [domainId, tenantId]
  )

  if (!result.rows[0]) {
    throw new Error("Dominio no encontrado")
  }

  const domain = mapRow(result.rows[0])

  if (domain.is_primary) {
    await syncTenantCustomDomain(tenantId, domain.domain_name)
  }

  return domain
}

export async function mockCloudflareConnect(
  tenantId: string,
  domainInput: string
): Promise<{ domain: StoreDomain; mock_zone_id: string }> {
  const domain = await createDomain(tenantId, domainInput, {
    is_cloudflare_automated: true,
  })

  const db = getPlatformPool()
  const mockZoneId = `cf_mock_${domain.id.replace(/-/g, "").slice(0, 12)}`

  const updated = await db.query<StoreDomainRow>(
    `update public.skrepayshop_store_domains
     set status = 'verifying',
         metadata = metadata || $2::jsonb,
         updated_at = now()
     where id = $1
     returning *`,
    [domain.id, JSON.stringify({ cloudflare_zone_id: mockZoneId })]
  )

  return {
    domain: mapRow(updated.rows[0]),
    mock_zone_id: mockZoneId,
  }
}

async function syncTenantCustomDomain(
  tenantId: string,
  domainName: string
): Promise<void> {
  const db = getPlatformPool()
  const url = domainToStorefrontUrl(domainName)

  await db.query(
    `update public.skrepayshop_tenants
     set custom_domain = $2, storefront_url = $3, updated_at = now()
     where id = $1`,
    [tenantId, domainName, url]
  )
}

export async function getTenantIdBySlug(slug: string): Promise<string | null> {
  const db = getPlatformPool()
  const result = await db.query<{ id: string }>(
    `select id from public.skrepayshop_tenants where slug = $1 limit 1`,
    [slug]
  )

  return result.rows[0]?.id ?? null
}
