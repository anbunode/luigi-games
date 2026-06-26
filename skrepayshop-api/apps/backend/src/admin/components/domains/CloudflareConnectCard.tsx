import { Button, Input, Label, Text, toast } from "@medusajs/ui"
import { useState } from "react"
import { connectCloudflareDomain } from "../../lib/domains-api"
import { SectionBlock } from "../product/SectionBlock"

export function CloudflareConnectCard({ onConnected }: { onConnected: () => void }) {
  const [domain, setDomain] = useState("")
  const [loading, setLoading] = useState(false)

  const connect = async () => {
    setLoading(true)
    try {
      const result = await connectCloudflareDomain(domain)
      toast.success(result.message || "Cloudflare conectado (simulado).")
      setDomain("")
      onConnected()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al conectar Cloudflare"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <SectionBlock
      title="Cloudflare (Autopiloto)"
      description="Conexión automática simulada. En producción inyectará DNS vía OAuth de Cloudflare."
    >
      <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-4">
        <Text weight="plus" className="mb-1">
          Conectar automáticamente con Cloudflare
        </Text>
        <Text size="small" className="text-ui-fg-subtle mb-4">
          Gestiona DNS sin copiar registros manualmente (fase futura).
        </Text>
        <div className="flex flex-col gap-y-2">
          <Label>Dominio</Label>
          <Input
            value={domain}
            placeholder="mitienda.com"
            onChange={(event) => setDomain(event.target.value)}
          />
        </div>
        <Button
          type="button"
          className="mt-4 w-fit"
          variant="secondary"
          isLoading={loading}
          onClick={connect}
        >
          Conectar automáticamente
        </Button>
      </div>
    </SectionBlock>
  )
}
