import { ChevronRight, Plus } from "@medusajs/icons"
import { Text } from "@medusajs/ui"

type Props = {
  icon: React.ReactNode
  label: string
  value: string
  inherited?: boolean
  comingSoon?: boolean
  onClick?: () => void
}

export function RegionConfigRow({
  icon,
  label,
  value,
  inherited = true,
  comingSoon = false,
  onClick,
}: Props) {
  const clickable = Boolean(onClick) || comingSoon

  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={onClick}
      className={`flex w-full items-center gap-x-3 border-b border-ui-border-base py-3.5 text-left last:border-0 ${
        clickable ? "hover:bg-ui-bg-subtle-hover cursor-pointer" : "cursor-default"
      }`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ui-border-base bg-ui-bg-subtle text-ui-fg-subtle">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <Text size="small" weight="plus" className="text-ui-fg-base">
          {label}
        </Text>
      </div>
      <div className="flex min-w-0 items-center gap-x-2">
        {inherited && !comingSoon ? (
          <span className="text-ui-fg-muted" title="Heredado de la tienda">
            🏠 →
          </span>
        ) : null}
        <Text size="small" className="truncate text-ui-fg-subtle max-w-[200px]">
          {comingSoon ? (
            <span className="italic text-ui-fg-muted">Próximamente</span>
          ) : (
            value || "—"
          )}
        </Text>
        {clickable ? (
          comingSoon ? (
            <Plus className="h-4 w-4 shrink-0 text-ui-fg-muted" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-ui-fg-muted" />
          )
        ) : null}
      </div>
    </button>
  )
}
