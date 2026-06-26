import { defineRouteConfig } from "@medusajs/admin-sdk"
import { GlobeEurope } from "@medusajs/icons"
import { Container, Heading, Tabs, Text, toast } from "@medusajs/ui"
import { useCallback, useEffect, useMemo, useState } from "react"
import { CloudflareConnectCard } from "../../../components/domains/CloudflareConnectCard"
import { DnsRecordsCard } from "../../../components/domains/DnsRecordsCard"
import {
  DomainListTable,
  ManualDomainForm,
} from "../../../components/domains/DomainForms"
import {
  fetchStoreDomains,
  type StoreDomainsResponse,
} from "../../../lib/domains-api"

const DomainsSettingsPage = () => {
  const [data, setData] = useState<StoreDomainsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("manual")

  const load = useCallback(async () => {
    try {
      const response = await fetchStoreDomains()
      setData(response)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al cargar dominios"
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const latestCustomDomain = useMemo(() => {
    if (!data?.domains.length) {
      return ""
    }

    const custom = data.domains.find(
      (domain) => !domain.domain_name.endsWith(".skrepay.shop")
    )

    return custom?.domain_name ?? ""
  }, [data])

  if (loading) {
    return (
      <Container className="p-6">
        <Text>Cargando dominios...</Text>
      </Container>
    )
  }

  return (
    <Container className="p-6">
      <div className="mb-6">
        <Heading level="h1">Dominios</Heading>
        <Text className="text-ui-fg-subtle mt-1">
          Configura el dominio público de tu tienda. El subdominio{" "}
          <strong>{data?.tenant_slug}.skrepay.shop</strong> se asigna
          automáticamente.
        </Text>
        {data?.primary_url ? (
          <Text size="small" className="text-ui-fg-subtle mt-2">
            URL principal actual: {data.primary_url}
          </Text>
        ) : null}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <Tabs.List>
          <Tabs.Trigger value="manual">Conexión manual</Tabs.Trigger>
          <Tabs.Trigger value="cloudflare">Cloudflare</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="manual" className="mt-4 flex flex-col gap-4">
          <ManualDomainForm onSaved={load} />
          {latestCustomDomain ? (
            <DnsRecordsCard domain={latestCustomDomain} />
          ) : null}
        </Tabs.Content>
        <Tabs.Content value="cloudflare" className="mt-4">
          <CloudflareConnectCard onConnected={load} />
        </Tabs.Content>
      </Tabs>

      <div className="mt-8">
        <Heading level="h2" className="txt-compact-medium-plus mb-3">
          Dominios configurados
        </Heading>
        <DomainListTable domains={data?.domains ?? []} onChange={load} />
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Dominios",
  icon: GlobeEurope,
})

export default DomainsSettingsPage
