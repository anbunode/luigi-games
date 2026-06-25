import type { StorefrontTheme } from "@/lib/theme-types"

function hexToRgb(hex: string): string | null {
  const normalized = hex.replace("#", "")
  if (normalized.length !== 6) {
    return null
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)

  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return null
  }

  return `${r} ${g} ${b}`
}

function darkenHex(hex: string, amount = 0.12): string {
  const normalized = hex.replace("#", "")
  if (normalized.length !== 6) {
    return "#059669"
  }

  const clamp = (value: number) => Math.max(0, Math.min(255, value))
  const r = clamp(
    Math.round(Number.parseInt(normalized.slice(0, 2), 16) * (1 - amount))
  )
  const g = clamp(
    Math.round(Number.parseInt(normalized.slice(2, 4), 16) * (1 - amount))
  )
  const b = clamp(
    Math.round(Number.parseInt(normalized.slice(4, 6), 16) * (1 - amount))
  )

  return `#${[r, g, b].map((part) => part.toString(16).padStart(2, "0")).join("")}`
}

export function ThemeVariables({ theme }: { theme: StorefrontTheme }) {
  const accent = theme.accent_color || "#10B981"
  const accentHover = darkenHex(accent)
  const accentRgb = hexToRgb(accent)
  const accentMuted = accentRgb
    ? `rgba(${accentRgb}, 0.16)`
    : "rgba(16, 185, 129, 0.16)"

  return (
    <style>{`
      :root {
        --accent: ${accent};
        --accent-hover: ${accentHover};
        --accent-muted: ${accentMuted};
      }
    `}</style>
  )
}
