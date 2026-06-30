import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useLayoutEffect } from "react"
import { installSettingsSidebarBridge } from "../lib/settings-sidebar-bridge"
import { SETTINGS_LOADING_FLAG, SETTINGS_LOADER_ID } from "../lib/settings-loading-overlay"

const BODY_FLAG = "data-skrepay-shopify-settings-nav"

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
    background: var(--bg-base, #111111);
  }

  #${SETTINGS_LOADER_ID} .skrepay-settings-spinner {
    width: 2rem;
    height: 2rem;
    border-radius: 9999px;
    border: 2px solid rgba(255, 255, 255, 0.12);
    border-top-color: rgba(255, 255, 255, 0.88);
    animation: skrepay-settings-spin 0.8s linear infinite;
  }

  #${SETTINGS_LOADER_ID} .skrepay-settings-loader-text {
    margin-top: 1rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
    color: rgba(255, 255, 255, 0.55);
  }

  @keyframes skrepay-settings-spin {
    to {
      transform: rotate(360deg);
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
`

const SettingsSidebarShopify = () => {
  useLayoutEffect(() => {
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
