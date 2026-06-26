export type StoreDomainRecord = {
  id: string
  domain_name: string
  is_primary: boolean
  status: "pending" | "verifying" | "active" | "failed"
  is_cloudflare_automated: boolean
}

export type StoreDomainsResponse = {
  domains: StoreDomainRecord[]
  primary_url: string | null
  tenant_slug: string
}

export async function fetchStoreDomains(): Promise<StoreDomainsResponse> {
  const response = await fetch("/admin/store-domains", {
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error("No se pudieron cargar los dominios")
  }

  return response.json()
}

export async function createStoreDomain(domainName: string) {
  const response = await fetch("/admin/store-domains", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain_name: domainName }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.message || "No se pudo guardar el dominio")
  }

  return response.json()
}

export async function verifyStoreDomain(domainId: string) {
  const response = await fetch(`/admin/store-domains/${domainId}/verify`, {
    method: "POST",
    credentials: "include",
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.message || "No se pudo verificar el dominio")
  }

  return response.json()
}

export async function setPrimaryStoreDomain(domainId: string) {
  const response = await fetch(`/admin/store-domains/${domainId}/primary`, {
    method: "POST",
    credentials: "include",
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.message || "No se pudo marcar como principal")
  }

  return response.json()
}

export async function connectCloudflareDomain(domainName: string) {
  const response = await fetch("/admin/store-domains/cloudflare/connect", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain_name: domainName }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.message || "No se pudo conectar Cloudflare")
  }

  return response.json()
}
