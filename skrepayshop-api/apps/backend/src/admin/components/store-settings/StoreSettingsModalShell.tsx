import { FocusModal } from "@medusajs/ui"
import type { ReactNode } from "react"
import { StoreSettingsModalHeader } from "./StoreSettingsModalHeader"

type StoreSettingsModalShellProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  footer: ReactNode
  maxWidthClassName?: string
}

export function StoreSettingsModalShell({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  maxWidthClassName = "!max-w-[720px]",
}: StoreSettingsModalShellProps) {
  return (
    <FocusModal open={open} onOpenChange={onOpenChange}>
      <FocusModal.Content
        className={`!flex !max-h-[calc(100vh-2rem)] !flex-col overflow-hidden ${maxWidthClassName}`}
      >
        <StoreSettingsModalHeader title={title} description={description} />
        <FocusModal.Body className="min-h-0 flex-1 overflow-y-auto p-6">
          {children}
        </FocusModal.Body>
        <FocusModal.Footer>
          <div className="flex w-full justify-end gap-x-2">{footer}</div>
        </FocusModal.Footer>
      </FocusModal.Content>
    </FocusModal>
  )
}
