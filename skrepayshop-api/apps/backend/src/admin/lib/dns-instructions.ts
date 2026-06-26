export const SKREPAY_DNS = {
  apexIp: "76.76.21.21",
  cnameTarget: "shops.skrepay.com",
} as const

export type DnsRecord = {
  type: "A" | "CNAME"
  name: string
  value: string
  description: string
}

export function normalizeDomainName(input: string): string {
  const trimmed = input.trim().toLowerCase()

  if (!trimmed) {
    return ""
  }

  try {
    const withProtocol = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`
    const url = new URL(withProtocol)
    return url.hostname.replace(/\.$/, "")
  } catch {
    return trimmed
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .replace(/\.$/, "")
  }
}

export function buildDnsRecords(domainName: string): DnsRecord[] {
  const host = normalizeDomainName(domainName)
  const isApex = !host.startsWith("www.") && host.split(".").length === 2

  if (isApex) {
    return [
      {
        type: "A",
        name: "@",
        value: SKREPAY_DNS.apexIp,
        description: "Apunta el dominio raíz a SkrepayShop",
      },
      {
        type: "CNAME",
        name: "www",
        value: SKREPAY_DNS.cnameTarget,
        description: "Subdominio www hacia el edge de SkrepayShop",
      },
    ]
  }

  return [
    {
      type: "CNAME",
      name: host,
      value: SKREPAY_DNS.cnameTarget,
      description: "Apunta tu dominio personalizado a SkrepayShop",
    },
  ]
}
