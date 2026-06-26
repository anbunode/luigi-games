import { Heading, Text } from "@medusajs/ui"
import type { ReactNode } from "react"

type SectionBlockProps = {
  title: string
  description?: string
  children: ReactNode
}

export function SectionBlock({
  title,
  description,
  children,
}: SectionBlockProps) {
  return (
    <div className="rounded-lg border border-ui-border-base bg-ui-bg-base p-4">
      <div className="mb-4">
        <Heading level="h2" className="txt-compact-medium-plus">
          {title}
        </Heading>
        {description ? (
          <Text size="small" className="text-ui-fg-subtle mt-1">
            {description}
          </Text>
        ) : null}
      </div>
      <div className="flex flex-col gap-y-4">{children}</div>
    </div>
  )
}
