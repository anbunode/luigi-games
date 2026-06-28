import { ChevronRight } from "@medusajs/icons"
import { Text } from "@medusajs/ui"

type Props = {
  icon: React.ReactNode
  label: string
  value: string
  /** If true, the row is clickable and shows a chevron */
  onClick?: () => void
  /** If true, shows a "Próximamente" toast instead of executing onClick */
  comingSoon?: boolean
}

export function RegionConfigItem({ icon, label, value, onClick, comingSoon }: Props) {
  const handleClick = () => {
    if (comingSoon) {
      // Visual feedback — no dead click
      return
    }
    onClick?.()
  }

  return (
    <div
      className={`flex items-center justify-between px-0 py-3 border-b border-ui-border-base last:border-0 ${onClick || comingSoon ? "cursor-pointer hover:bg-ui-bg-subtle-hover rounded-md px-2 -mx-2 transition-colors" : ""}`}
      onClick={handleClick}
    >
      <div className="flex items-center gap-x-3">
        <span className="text-ui-fg-subtle">{icon}</span>
        <Text size="small" weight="plus" className="text-ui-fg-base">
          {label}
        </Text>
      </div>
      <div className="flex items-center gap-x-2">
        <Text size="small" className="text-ui-fg-subtle">
          {comingSoon ? (
            <span className="italic text-ui-fg-muted">Próximamente</span>
          ) : (
            value
          )}
        </Text>
        {(onClick || comingSoon) && (
          <ChevronRight className="text-ui-fg-muted w-4 h-4" />
        )}
      </div>
    </div>
  )
}
