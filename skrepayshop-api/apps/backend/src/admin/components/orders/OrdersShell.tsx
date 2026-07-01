import type { CSSProperties, ReactNode } from "react"
import { skrepayColors, skrepayRadius } from "../../lib/skrepay-theme"

export function OrdersPanel({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={className}
      style={{
        background: skrepayColors.surfaceRaised,
        border: `1px solid ${skrepayColors.border}`,
        borderRadius: skrepayRadius.md,
        boxShadow: "0 1px 0 rgba(255,255,255,0.03) inset",
      }}
    >
      {children}
    </div>
  )
}

export function OrdersShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div
      className="flex flex-col gap-5 p-6"
      data-skrepay-orders-shell
      style={{
        minHeight: "100%",
        margin: "-1rem",
        padding: "1.5rem",
        background:
          "linear-gradient(180deg, #101210 0%, #0c0e0c 100%)",
        borderRadius: skrepayRadius.md,
        border: `1px solid ${skrepayColors.border}`,
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: skrepayColors.text }}
          >
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-sm" style={{ color: skrepayColors.textMuted }}>
              {subtitle}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  )
}
