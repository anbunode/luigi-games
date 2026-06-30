import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useLayoutEffect } from "react"
import { installSettingsSidebarBridge } from "../lib/settings-sidebar-bridge"
import { SETTINGS_LOADER_LOGO_URL } from "../lib/settings-loading-logo"
import { SETTINGS_LOADING_FLAG, SETTINGS_LOADER_ID } from "../lib/settings-loading-overlay"

const BODY_FLAG = "data-skrepay-shopify-settings-nav"
const SETTINGS_TOPBAR_FLAG = "data-skrepay-settings-topbar"
const HIDDEN_BREADCRUMB = "data-skrepay-settings-breadcrumb-hidden"

const shopifySettingsSidebarStyles = `
  body[${SETTINGS_LOADING_FLAG}] aside,
  body[${SETTINGS_LOADING_FLAG}] main {
    visibility: hidden !important;
  }

  #${SETTINGS_LOADER_ID} {
    position: fixed;
    inset: 0;
    z-index: 99999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: var(--bg-base);
  }

  #${SETTINGS_LOADER_ID} .skrepay-loader-logo {
    width: min(72vw, 320px);
    height: auto;
    animation: skrepay-logo-blink 1.6s ease-in-out infinite;
    user-select: none;
    pointer-events: none;
  }

  @keyframes skrepay-logo-blink {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.38;
    }
  }

  body[${BODY_FLAG}] aside div.py-3 > div.px-3:first-child {
    display: none !important;
  }

  body[${BODY_FLAG}] aside div.flex.items-center.justify-center.px-3 {
    display: none !important;
  }

  body[${BODY_FLAG}] aside nav a[data-skrepay-settings-nav-link] {
    display: flex !important;
    align-items: center;
    gap: 0.625rem;
    border-radius: 0.5rem;
    margin-inline: 0.125rem;
    padding: 0.5rem 0.625rem !important;
  }

  body[${BODY_FLAG}] aside nav .px-3 {
    padding-left: 0.5rem !important;
    padding-right: 0.5rem !important;
  }

  body[${BODY_FLAG}] div.h-screen.border-e {
    width: 260px !important;
  }

  body[${BODY_FLAG}] [${SETTINGS_TOPBAR_FLAG}="true"] > [${HIDDEN_BREADCRUMB}="true"],
  body[${BODY_FLAG}] [${HIDDEN_BREADCRUMB}="true"] {
    display: none !important;
    width: 0 !important;
    min-width: 0 !important;
    max-width: 0 !important;
    opacity: 0 !important;
    overflow: hidden !important;
    padding: 0 !important;
    margin: 0 !important;
    pointer-events: none !important;
  }

  body[${BODY_FLAG}] [${SETTINGS_TOPBAR_FLAG}="true"] > :not(:first-child):not(:last-child) {
    display: none !important;
  }

  body[${BODY_FLAG}] div:has(> main) > div[class*="h-14"] > :nth-child(2),
  body[${BODY_FLAG}] aside ~ div > div[class*="h-14"] > :nth-child(2),
  body[${BODY_FLAG}] aside ~ div div[class*="h-14"][class*="items-center"] > :nth-child(2) {
    display: none !important;
  }

  body[${BODY_FLAG}] div:has(> main) > div[class*="h-14"] a[href*="/settings"],
  body[${BODY_FLAG}] div:has(> main) > div[class*="h-14"] a[href*="/app/settings"],
  body[${BODY_FLAG}] aside ~ div div[class*="h-14"] a[href*="/settings"],
  body[${BODY_FLAG}] aside ~ div div[class*="h-14"] a[href*="/app/settings"] {
    display: none !important;
  }
`

const SettingsSidebarShopify = () => {
  useLayoutEffect(() => {
    const preloadLogo = new Image()
    preloadLogo.src = SETTINGS_LOADER_LOGO_URL
    installSettingsSidebarBridge()
  }, [])

  return <style>{shopifySettingsSidebarStyles}</style>
}

export const config = defineWidgetConfig({
  zone: [
    "store.details.before",
    "store.details.after",
    "user.list.before",
    "region.list.before",
    "tax.list.before",
    "location.list.before",
    "sales_channel.list.before",
    "product_type.list.before",
    "product_tag.list.before",
    "return_reason.list.before",
    "refund_reason.list.before",
    "api_key.list.before",
    "workflow.list.before",
    "order.list.before",
    "product.list.before",
    "login.before",
  ],
})

export default SettingsSidebarShopify
