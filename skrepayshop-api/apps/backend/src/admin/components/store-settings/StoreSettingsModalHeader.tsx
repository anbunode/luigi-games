import { FocusModal, Heading, IconButton, Text } from "@medusajs/ui"
import { XMark } from "@medusajs/icons"

type StoreSettingsModalHeaderProps = {
  title: string
  description?: string
}

export function StoreSettingsModalHeader({
  title,
  description,
}: StoreSettingsModalHeaderProps) {
  return (
    <div className="border-ui-border-base flex items-start gap-x-3 border-b px-4 py-3">
      <FocusModal.Close asChild>
        <IconButton
          size="small"
          type="button"
          variant="transparent"
          className="mt-0.5"
        >
          <XMark />
        </IconButton>
      </FocusModal.Close>
      <div className="min-w-0">
        <Heading level="h2">{title}</Heading>
        {description ? (
          <Text size="small" className="text-ui-fg-subtle mt-1">
            {description}
          </Text>
        ) : null}
      </div>
    </div>
  )
}
