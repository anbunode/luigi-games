import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect } from "react"
import { getPlatformLoginUrl } from "../lib/platform-url"

const PlatformLoginRedirect = () => {
  useEffect(() => {
    if (document.referrer.includes("/skrepay/session-bridge")) {
      return
    }

    const loginUrl = getPlatformLoginUrl()
    window.location.replace(loginUrl)
  }, [])

  return null
}

export const config = defineWidgetConfig({
  zone: "login.before",
})

export default PlatformLoginRedirect
