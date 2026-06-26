import type { DnsRecord } from "../../lib/dns-instructions"
import { IconButton, Text } from "@medusajs/ui"
import { SquareTwoStack } from "@medusajs/icons"
import { useState } from "react"

export function CopyableDnsRow({ record }: { record: DnsRecord }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(record.value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="grid grid-cols-1 gap-2 rounded-md border border-ui-border-base p-3 md:grid-cols-[80px_1fr_1fr_auto] md:items-center">
      <Text size="small" weight="plus">
        {record.type}
      </Text>
      <Text size="small" className="font-mono">
        {record.name}
      </Text>
      <Text size="small" className="font-mono break-all">
        {record.value}
      </Text>
      <IconButton type="button" variant="transparent" onClick={copy}>
        <SquareTwoStack />
      </IconButton>
      <Text size="xsmall" className="text-ui-fg-subtle md:col-span-4">
        {record.description}
        {copied ? " · Copiado" : ""}
      </Text>
    </div>
  )
}
