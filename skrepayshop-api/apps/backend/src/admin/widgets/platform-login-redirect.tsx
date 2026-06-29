import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Text } from "@medusajs/ui"
import { useLayoutEffect } from "react"
import { getPlatformLoginUrl } from "../lib/platform-url"

const PlatformLoginRedirect = () => {
  useLayoutEffect(() => {
    window.location.replace(getPlatformLoginUrl())
  }, [])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6 py-16">
      <Text weight="plus">Redirigiendo al inicio de sesión…</Text>
      <Text size="small" className="text-ui-fg-subtle">
        Si no avanza, abre{" "}
        <a className="text-ui-fg-interactive underline" href={getPlatformLoginUrl()}>
          skrepay.com/login
        </a>
      </Text>
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "login.after",
})

export default PlatformLoginRedirect
