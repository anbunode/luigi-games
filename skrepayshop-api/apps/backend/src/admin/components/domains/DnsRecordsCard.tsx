import { buildDnsRecords } from "../../lib/dns-instructions"
import { Text } from "@medusajs/ui"
import { CopyableDnsRow } from "./CopyableDnsRow"
import { SectionBlock } from "../product/SectionBlock"

export function DnsRecordsCard({ domain }: { domain: string }) {
  const records = buildDnsRecords(domain)

  if (!domain.trim()) {
    return null
  }

  return (
    <SectionBlock
      title="Registros DNS requeridos"
      description="Copia estos registros en tu proveedor de dominio (GoDaddy, Namecheap, Cloudflare, etc.)."
    >
      <div className="flex flex-col gap-2">
        {records.map((record) => (
          <CopyableDnsRow key={`${record.type}-${record.name}`} record={record} />
        ))}
      </div>
      <Text size="xsmall" className="text-ui-fg-subtle">
        La verificación manual marcará el dominio como activo. La automatización
        DNS llegará en una fase posterior.
      </Text>
    </SectionBlock>
  )
}
