/** Skrepay admin visual tokens — verde suave, contenedores cuadrados con radio mínimo. */
export const SKREPAY_THEME_MARKER = "skrepay-theme-active"

export const skrepayColors = {
  accent: "#7BAE8A",
  accentStrong: "#5F9A70",
  accentSoft: "#A8C9B2",
  accentMuted: "rgba(123, 174, 138, 0.14)",
  accentGlow: "rgba(123, 174, 138, 0.28)",
  surface: "rgba(255, 255, 255, 0.03)",
  surfaceRaised: "rgba(255, 255, 255, 0.05)",
  border: "rgba(255, 255, 255, 0.08)",
  borderStrong: "rgba(123, 174, 138, 0.22)",
  text: "rgba(255, 255, 255, 0.92)",
  textMuted: "rgba(255, 255, 255, 0.52)",
  success: "#6BC48A",
  successBg: "rgba(107, 196, 138, 0.14)",
  warning: "#C9A86A",
  warningBg: "rgba(201, 168, 106, 0.14)",
  danger: "#C97A7A",
  dangerBg: "rgba(201, 122, 122, 0.14)",
  neutralBg: "rgba(255, 255, 255, 0.06)",
} as const

export const skrepayRadius = {
  sm: "4px",
  md: "6px",
  lg: "8px",
} as const

export const skrepayFont =
  "'DM Sans', 'Segoe UI', system-ui, -apple-system, sans-serif"

export function skrepayThemeCss(): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');

    html.${SKREPAY_THEME_MARKER} [data-skrepay-orders-shell],
    html.${SKREPAY_THEME_MARKER} [data-skrepay-orders-shell] * {
      font-family: ${skrepayFont};
    }

    html.${SKREPAY_THEME_MARKER} [data-skrepay-orders-shell] {
      --skrepay-accent: ${skrepayColors.accent};
      --skrepay-accent-strong: ${skrepayColors.accentStrong};
      --skrepay-accent-muted: ${skrepayColors.accentMuted};
      --skrepay-surface: ${skrepayColors.surface};
      --skrepay-surface-raised: ${skrepayColors.surfaceRaised};
      --skrepay-border: ${skrepayColors.border};
      --skrepay-radius-sm: ${skrepayRadius.sm};
      --skrepay-radius-md: ${skrepayRadius.md};
      color: ${skrepayColors.text};
    }
  `
}

export function enableSkrepayTheme() {
  if (typeof document === "undefined") return
  document.documentElement.classList.add(SKREPAY_THEME_MARKER)
}
