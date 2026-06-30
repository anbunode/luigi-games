import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useLayoutEffect, useState } from "react"
import { createPortal } from "react-dom"
import { SettingsShopifySidebar } from "../components/settings-sidebar/SettingsShopifySidebar"
import {
  isSettingsPage,
  SKREPAY_ROUTE_CHANGE_EVENT,
} from "../lib/region-routes"
import {
  scrapeSettingsNavItems,
  type SettingsNavItem,
} from "../lib/settings-sidebar-routes"

const BODY_FLAG = "data-skrepay-shopify-settings-nav"
const ASIDE_FLAG = "data-skrepay-settings-aside"
const MOUNT_FLAG = "data-skrepay-settings-sidebar-mount"

const shopifySettingsSidebarStyles = `
  body[${BODY_FLAG}] aside[${ASIDE_FLAG}] > *:not([${MOUNT_FLAG}]) {
    display: none !important;
  }

  body[${BODY_FLAG}] aside[${ASIDE_FLAG}] {
    display: flex !important;
    min-height: 0 !important;
    flex-direction: column !important;
    overflow: hidden !important;
    padding: 0 !important;
  }

  body[${BODY_FLAG}] [${MOUNT_FLAG}] {
    display: flex !important;
    min-height: 0 !important;
    flex: 1 1 auto !important;
    width: 100% !important;
  }

  body[${BODY_FLAG}] div.h-screen.border-e {
    width: 260px !important;
  }
`

function findSettingsAsides(): HTMLElement[] {
  return [...document.querySelectorAll("aside")].filter((aside) => {
    return aside.querySelector('nav a[href*="/settings/"]') !== null
  })
}

function ensureSidebarMount(aside: HTMLElement): HTMLElement {
  aside.setAttribute(ASIDE_FLAG, "true")

  let mount = aside.querySelector(`[${MOUNT_FLAG}]`)

  if (!(mount instanceof HTMLElement)) {
    mount = document.createElement("div")
    mount.setAttribute(MOUNT_FLAG, "true")
    mount.className = "flex h-full min-h-0 w-full flex-1 flex-col"
    aside.appendChild(mount)
  }

  return mount
}

const SettingsSidebarShopify = () => {
  const [mounts, setMounts] = useState<HTMLElement[]>([])
  const [navItems, setNavItems] = useState<SettingsNavItem[]>([])

  useLayoutEffect(() => {
    const sync = () => {
      if (!isSettingsPage(window.location.pathname)) {
        document.body.removeAttribute(BODY_FLAG)
        setMounts([])
        return
      }

      const scraped = scrapeSettingsNavItems()

      if (scraped.length > 0) {
        setNavItems(scraped)
      }

      const nextMounts = findSettingsAsides().map(ensureSidebarMount)

      document.body.setAttribute(BODY_FLAG, "true")
      setMounts(nextMounts)
    }

    sync()

    const observer = new MutationObserver(sync)

    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener(SKREPAY_ROUTE_CHANGE_EVENT, sync)
    window.addEventListener("popstate", sync)

    return () => {
      observer.disconnect()
      window.removeEventListener(SKREPAY_ROUTE_CHANGE_EVENT, sync)
      window.removeEventListener("popstate", sync)
      document.body.removeAttribute(BODY_FLAG)

      document.querySelectorAll(`[${ASIDE_FLAG}]`).forEach((aside) => {
        aside.removeAttribute(ASIDE_FLAG)
      })
    }
  }, [])

  return (
    <>
      <style>{shopifySettingsSidebarStyles}</style>
      {mounts.map((mount, index) =>
        createPortal(
          <SettingsShopifySidebar items={navItems} />,
          mount,
          `skrepay-settings-sidebar-${index}`
        )
      )}
    </>
  )
}

export const config = defineWidgetConfig({
  zone: [
    "store.details.before",
    "store.details.after",
    "order.list.before",
    "product.list.before",
    "region.list.before",
  ],
})

export default SettingsSidebarShopify
