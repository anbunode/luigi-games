export const SETTINGS_SHELL_FLAG = "data-skrepay-shopify-settings"

export const settingsShopifySkinStyles = `
  body[${SETTINGS_SHELL_FLAG}] main > div > div.max-w-\\[1600px\\] {
    max-width: 56rem !important;
    gap: 2rem !important;
    padding-top: 1.5rem !important;
    padding-bottom: 2rem !important;
  }

  body[${SETTINGS_SHELL_FLAG}] main .divide-y.p-0 {
    border-radius: 0.75rem !important;
    border: 1px solid var(--border-base, rgba(255, 255, 255, 0.08)) !important;
    background-color: var(--bg-base, #1c1c1c) !important;
    box-shadow: var(--shadow-borders-base, 0 0 0 1px rgba(255, 255, 255, 0.06)) !important;
    overflow: hidden !important;
  }

  body[${SETTINGS_SHELL_FLAG}] main .flex.flex-col.gap-y-3 > .divide-y.p-0,
  body[${SETTINGS_SHELL_FLAG}] main .flex.flex-col.gap-y-4 > .divide-y.p-0 {
    margin-top: 0.25rem;
  }

  body[${SETTINGS_SHELL_FLAG}] main .divide-y.p-0 > div:first-child {
    padding-left: 1.25rem !important;
    padding-right: 1.25rem !important;
  }

  body[${SETTINGS_SHELL_FLAG}] main h1.\\!txt-compact-xlarge-plus,
  body[${SETTINGS_SHELL_FLAG}] main h1.txt-compact-xlarge-plus,
  body[${SETTINGS_SHELL_FLAG}] main h2.txt-compact-large-plus {
    letter-spacing: -0.01em;
  }

  body[${SETTINGS_SHELL_FLAG}] main table tbody tr {
    transition: background-color 120ms ease;
  }

  body[${SETTINGS_SHELL_FLAG}] main table tbody tr:hover {
    background-color: var(--bg-base-hover, rgba(255, 255, 255, 0.04)) !important;
  }

  body[${SETTINGS_SHELL_FLAG}] main [data-table-toolbar],
  body[${SETTINGS_SHELL_FLAG}] main .flex.flex-col.gap-y-3 > div.flex.items-center.justify-between.px-6.py-4 {
    padding-top: 1rem !important;
    padding-bottom: 1rem !important;
  }

  body[${SETTINGS_SHELL_FLAG}] [data-skrepay-shopify-modal] {
    border-radius: 0.75rem !important;
    border: 1px solid var(--border-base, rgba(255, 255, 255, 0.08)) !important;
    box-shadow: var(--shadow-elevation-modal, 0 16px 48px rgba(0, 0, 0, 0.45)) !important;
    overflow: hidden !important;
  }

  body[${SETTINGS_SHELL_FLAG}] [data-vaul-drawer][data-skrepay-shopify-modal] {
    left: 50% !important;
    right: auto !important;
    top: 50% !important;
    bottom: auto !important;
    transform: translate(-50%, -50%) !important;
    width: min(720px, calc(100vw - 2rem)) !important;
    max-width: min(720px, calc(100vw - 2rem)) !important;
    max-height: calc(100vh - 2rem) !important;
    margin: 0 !important;
  }

  body[${SETTINGS_SHELL_FLAG}] [role="dialog"][data-skrepay-shopify-modal]:not([data-vaul-drawer]) {
    width: min(720px, calc(100vw - 2rem)) !important;
    max-width: min(720px, calc(100vw - 2rem)) !important;
    max-height: calc(100vh - 2rem) !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
  }

  body[${SETTINGS_SHELL_FLAG}] [data-skrepay-shopify-modal] [class*="Header"],
  body[${SETTINGS_SHELL_FLAG}] [data-skrepay-shopify-modal] header {
    border-bottom: 1px solid var(--border-base, rgba(255, 255, 255, 0.08)) !important;
    padding: 0.75rem 1rem !important;
  }

  body[${SETTINGS_SHELL_FLAG}] [data-skrepay-shopify-modal] [class*="Footer"],
  body[${SETTINGS_SHELL_FLAG}] [data-skrepay-shopify-modal] footer {
    border-top: 1px solid var(--border-base, rgba(255, 255, 255, 0.08)) !important;
    padding: 0.75rem 1rem !important;
    background-color: var(--bg-base, #1c1c1c) !important;
  }

  body[${SETTINGS_SHELL_FLAG}] [data-skrepay-shopify-modal] [class*="Body"],
  body[${SETTINGS_SHELL_FLAG}] [data-skrepay-shopify-modal] form > div.flex.flex-1.flex-col {
    overflow-y: auto !important;
    min-height: 0 !important;
  }

  body[${SETTINGS_SHELL_FLAG}] [data-skrepay-shopify-modal] kbd {
    display: none !important;
  }

  body[${SETTINGS_SHELL_FLAG}] [data-skrepay-shopify-modal] .txt-compact-small.text-ui-fg-muted:has(+ button) {
    display: none !important;
  }

  body[${SETTINGS_SHELL_FLAG}] div.h-screen.border-e {
    width: 260px !important;
  }

  body[${SETTINGS_SHELL_FLAG}] aside div.py-3 > div.px-3:first-child {
    display: none !important;
  }

  body[${SETTINGS_SHELL_FLAG}] aside div.flex.items-center.justify-center.px-3 {
    display: none !important;
  }

  body[${SETTINGS_SHELL_FLAG}] aside nav a[data-skrepay-settings-nav-link] {
    display: flex !important;
    align-items: center;
    gap: 0.625rem;
    border-radius: 0.5rem;
    margin-inline: 0.125rem;
    padding: 0.5rem 0.625rem !important;
  }

  body[${SETTINGS_SHELL_FLAG}] aside nav .px-3 {
    padding-left: 0.5rem !important;
    padding-right: 0.5rem !important;
  }

  body[${SETTINGS_SHELL_FLAG}] main .flex.flex-col.gap-y-3 > div:has(a[href$="metadata/edit"]),
  body[${SETTINGS_SHELL_FLAG}] main .flex.flex-col.gap-y-3 > div:has(a[href="json"]),
  body[${SETTINGS_SHELL_FLAG}] main .flex.flex-col.gap-y-3 > div:has(a[href$="/json"]) {
    display: none !important;
  }

  body[${SETTINGS_SHELL_FLAG}] main button:has(+ .text-ui-fg-subtle):where([aria-label="JSON"]),
  body[${SETTINGS_SHELL_FLAG}] main a[href$="metadata/edit"] {
    display: none !important;
  }
`
