import type { CSSProperties, ReactNode } from "react"
import { skrepayColors, skrepayRadius } from "../../lib/skrepay-theme"

type ButtonVariant = "primary" | "ghost" | "danger"

const baseButton: CSSProperties = {
  borderRadius: skrepayRadius.sm,
  padding: "10px 14px",
  fontSize: "13px",
  fontWeight: 600,
  lineHeight: 1,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  textDecoration: "none",
  cursor: "pointer",
  border: "1px solid transparent",
  whiteSpace: "nowrap",
}

function buttonStyle(variant: ButtonVariant, disabled?: boolean): CSSProperties {
  if (disabled) {
    return {
      ...baseButton,
      opacity: 0.5,
      cursor: "not-allowed",
      background: skrepayColors.surface,
      color: skrepayColors.textMuted,
      borderColor: skrepayColors.border,
    }
  }

  if (variant === "primary") {
    return {
      ...baseButton,
      background: `linear-gradient(180deg, ${skrepayColors.accent} 0%, ${skrepayColors.accentStrong} 100%)`,
      color: "#0f1410",
      boxShadow: `0 0 0 1px ${skrepayColors.accentGlow}`,
    }
  }

  if (variant === "danger") {
    return {
      ...baseButton,
      background: skrepayColors.dangerBg,
      color: skrepayColors.danger,
      borderColor: "rgba(201, 122, 122, 0.35)",
    }
  }

  return {
    ...baseButton,
    background: skrepayColors.surface,
    color: skrepayColors.text,
    borderColor: skrepayColors.border,
  }
}

export function SkrepayButton({
  children,
  variant = "primary",
  href,
  onClick,
  disabled,
  type = "button",
}: {
  children: ReactNode
  variant?: ButtonVariant
  href?: string
  onClick?: () => void
  disabled?: boolean
  type?: "button" | "submit"
}) {
  const styles = buttonStyle(variant, disabled)

  if (href && !disabled) {
    return (
      <a href={href} style={styles}>
        {children}
      </a>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={styles}
    >
      {children}
    </button>
  )
}

export function SkrepaySection({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div
      style={{
        background: skrepayColors.surfaceRaised,
        border: `1px solid ${skrepayColors.border}`,
        borderRadius: skrepayRadius.md,
        overflow: "hidden",
      }}
    >
      <div
        className="flex items-center justify-between gap-3 px-5 py-4"
        style={{ borderBottom: `1px solid ${skrepayColors.border}` }}
      >
        <h2
          className="text-sm font-semibold"
          style={{ color: skrepayColors.text }}
        >
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  )
}

export function SkrepayFieldLabel({ children }: { children: ReactNode }) {
  return (
    <label
      className="mb-1.5 block text-xs font-medium"
      style={{ color: skrepayColors.textMuted }}
    >
      {children}
    </label>
  )
}

export function skrepayInputStyle(): CSSProperties {
  return {
    width: "100%",
    background: skrepayColors.surface,
    border: `1px solid ${skrepayColors.border}`,
    borderRadius: skrepayRadius.sm,
    color: skrepayColors.text,
    padding: "10px 12px",
    fontSize: "13px",
    outline: "none",
  }
}

export function SkrepayModalBackdrop({
  open,
  onClose,
  children,
  width = "min(560px, calc(100vw - 2rem))",
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  width?: string
}) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.62)" }}
      onClick={onClose}
    >
      <div
        className="max-h-[calc(100vh-2rem)] overflow-y-auto"
        style={{
          width,
          background: "#101210",
          border: `1px solid ${skrepayColors.border}`,
          borderRadius: skrepayRadius.md,
          boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

export function SkrepayModalHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string
  subtitle?: string
  onClose: () => void
}) {
  return (
    <div
      className="flex items-start justify-between gap-3 px-5 py-4"
      style={{ borderBottom: `1px solid ${skrepayColors.border}` }}
    >
      <div>
        <h3 className="text-lg font-semibold" style={{ color: skrepayColors.text }}>
          {title}
        </h3>
        {subtitle ? (
          <p className="mt-1 text-sm" style={{ color: skrepayColors.textMuted }}>
            {subtitle}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="px-2 py-1 text-sm"
        style={{ color: skrepayColors.textMuted }}
      >
        ✕
      </button>
    </div>
  )
}
