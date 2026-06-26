import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useLayoutEffect } from "react"
import { installAuthBridge } from "../lib/auth-bridge"
import { getPlatformLoginUrl } from "../lib/platform-url"

const hideLoginStyles = `
  html, body, #medusa, #root, main {
    visibility: hidden !important;
    background: #f4f6f5 !important;
  }
`

const PlatformLoginRedirect = () => {
  useLayoutEffect(() => {
    installAuthBridge()
    window.location.replace(getPlatformLoginUrl())
  }, [])

  return <style>{hideLoginStyles}</style>
}

export const config = defineWidgetConfig({
  zone: "login.after",
})

export default PlatformLoginRedirect
