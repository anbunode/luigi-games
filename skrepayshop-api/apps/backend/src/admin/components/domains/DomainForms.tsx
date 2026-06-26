import { Badge, Button, Input, Label, Text, toast } from "@medusajs/ui"
import { useState } from "react"
import {
  createStoreDomain,
  setPrimaryStoreDomain,
  verifyStoreDomain,
} from "../../lib/domains-api"
import { SectionBlock } from "../product/SectionBlock"

export function ManualDomainForm({ onSaved }: { onSaved: () => void }) {
  const [domain, setDomain] = useState("")
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await createStoreDomain(domain)
      toast.success("Dominio registrado. Configura los DNS y verifica.")
      setDomain("")
      onSaved()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al guardar dominio"
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <SectionBlock
      title="Conexión manual"
      description="Añade tu dominio personalizado. Después copia los registros DNS en tu proveedor."
    >
      <div className="flex flex-col gap-y-2">
        <Label>Dominio personalizado</Label>
        <Input
          value={domain}
          placeholder="www.mitienda.com"
          onChange={(event) => setDomain(event.target.value)}
        />
      </div>
      <Button
        type="button"
        variant="primary"
        className="w-fit"
        isLoading={saving}
        onClick={save}
      >
        Guardar dominio
      </Button>
    </SectionBlock>
  )
}

const statusLabel: Record<string, string> = {
  pending: "Pendiente",
  verifying: "Verificando",
  active: "Activo",
  failed: "Fallido",
}

export function DomainListTable({
  domains,
  onChange,
}: {
  domains: Array<{
    id: string
    domain_name: string
    is_primary: boolean
    status: string
    is_cloudflare_automated: boolean
  }>
  onChange: () => void
}) {
  if (domains.length === 0) {
    return (
      <Text size="small" className="text-ui-fg-subtle">
        Aún no hay dominios configurados.
      </Text>
    )
  }

  const verify = async (id: string) => {
    try {
      await verifyStoreDomain(id)
      toast.success("Dominio marcado como activo.")
      onChange()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo verificar"
      )
    }
  }

  const makePrimary = async (id: string) => {
    try {
      await setPrimaryStoreDomain(id)
      toast.success("Dominio principal actualizado.")
      onChange()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo actualizar"
      )
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {domains.map((domain) => (
        <div
          key={domain.id}
          className="flex flex-col gap-3 rounded-lg border border-ui-border-base p-4 md:flex-row md:items-center md:justify-between"
        >
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <Text weight="plus">{domain.domain_name}</Text>
              {domain.is_primary ? <Badge color="green">Principal</Badge> : null}
              <Badge>{statusLabel[domain.status] ?? domain.status}</Badge>
              {domain.is_cloudflare_automated ? (
                <Badge color="blue">Cloudflare</Badge>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {domain.status !== "active" ? (
              <Button
                type="button"
                size="small"
                variant="secondary"
                onClick={() => verify(domain.id)}
              >
                Marcar como verificado
              </Button>
            ) : null}
            {domain.status === "active" && !domain.is_primary ? (
              <Button
                type="button"
                size="small"
                variant="secondary"
                onClick={() => makePrimary(domain.id)}
              >
                Hacer principal
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}
