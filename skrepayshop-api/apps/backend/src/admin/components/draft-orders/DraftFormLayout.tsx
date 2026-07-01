import { Text } from "@medusajs/ui"
import type { ReactNode } from "react"

export function DraftFormDivider() {
  return <div className="border-b border-dashed border-ui-border-base" />
}

export function DraftFormRow({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 md:gap-x-3">
      <div>
        <Text size="small" weight="plus">
          {label}
        </Text>
        {hint ? (
          <Text size="small" className="text-ui-fg-subtle mt-1">
            {hint}
          </Text>
        ) : null}
      </div>
      <div className="flex flex-col gap-y-3">{children}</div>
    </div>
  )
}
