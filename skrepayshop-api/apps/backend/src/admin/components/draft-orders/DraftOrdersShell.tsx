import { Heading, Text } from "@medusajs/ui"
import type { ReactNode } from "react"

export function DraftPanelCard({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-ui-border-base bg-ui-bg-base shadow-borders-base">
      {children}
    </div>
  )
}

export function DraftOrdersShell({
  title,
  description,
  actions,
  children,
}: {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-y-4 p-6" data-skrepay-draft-orders-shell>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Heading level="h1" className="txt-xlarge-plus">
            {title}
          </Heading>
          {description ? (
            <Text size="small" className="text-ui-fg-subtle mt-1">
              {description}
            </Text>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  )
}
