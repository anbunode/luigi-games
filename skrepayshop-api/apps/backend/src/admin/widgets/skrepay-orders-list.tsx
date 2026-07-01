import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useLayoutEffect } from "react"
import { OrdersListPage } from "../components/orders/OrdersListPage"
import { enableSkrepayTheme } from "../lib/skrepay-theme"

function hideNativeOrderList(shell: HTMLElement) {
  const divideHost = shell.closest(".divide-y")
  if (!divideHost) {
    return
  }

  for (const child of Array.from(divideHost.children)) {
    if (!child.contains(shell)) {
      ;(child as HTMLElement).style.setProperty("display", "none", "important")
    }
  }
}

const SkrepayOrdersListWidget = () => {
  useLayoutEffect(() => {
    enableSkrepayTheme()

    const apply = () => {
      const shell = document.querySelector<HTMLElement>("[data-skrepay-orders-shell]")
      if (shell) {
        hideNativeOrderList(shell)
      }
    }

    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  return <OrdersListPage />
}

export const config = defineWidgetConfig({
  zone: "order.list.before",
})

export default SkrepayOrdersListWidget
