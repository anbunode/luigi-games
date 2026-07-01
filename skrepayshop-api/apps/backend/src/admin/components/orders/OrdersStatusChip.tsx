import { skrepayColors, skrepayRadius } from "../../lib/skrepay-theme"

type ChipTone = "success" | "warning" | "danger" | "neutral"

const toneStyles: Record<
  ChipTone,
  { bg: string; color: string; border: string; dot: string }
> = {
  success: {
    bg: skrepayColors.successBg,
    color: skrepayColors.success,
    border: "rgba(107, 196, 138, 0.28)",
    dot: skrepayColors.success,
  },
  warning: {
    bg: skrepayColors.warningBg,
    color: skrepayColors.warning,
    border: "rgba(201, 168, 106, 0.28)",
    dot: skrepayColors.warning,
  },
  danger: {
    bg: skrepayColors.dangerBg,
    color: skrepayColors.danger,
    border: "rgba(201, 122, 122, 0.28)",
    dot: skrepayColors.danger,
  },
  neutral: {
    bg: skrepayColors.neutralBg,
    color: skrepayColors.textMuted,
    border: skrepayColors.border,
    dot: skrepayColors.textMuted,
  },
}

export function paymentTone(status: string): ChipTone {
  if (status === "captured") return "success"
  if (status === "not_paid" || status === "awaiting") return "warning"
  if (status === "canceled" || status === "requires_action") return "danger"
  return "neutral"
}

export function fulfillmentTone(status: string): ChipTone {
  if (status === "fulfilled") return "success"
  if (status === "not_fulfilled") return "warning"
  return "neutral"
}

export function OrdersStatusChip({
  label,
  tone,
}: {
  label: string
  tone: ChipTone
}) {
  const style = toneStyles[tone]

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium leading-none"
      style={{
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        borderRadius: skrepayRadius.sm,
      }}
    >
      <span
        className="inline-block h-1.5 w-1.5 shrink-0"
        style={{
          backgroundColor: style.dot,
          borderRadius: "2px",
        }}
      />
      {label}
    </span>
  )
}
