import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useLayoutEffect } from "react"
import { useParams } from "react-router-dom"
import { OrderDetailPage } from "../components/orders/OrderDetailPage"
import { enableSkrepayTheme } from "../lib/skrepay-theme"

function hideNativeOrderDetail(shell: HTMLElement) {
  const divideHost = shell.closest(".divide-y")
  if (divideHost) {
    for (const child of Array.from(divideHost.children)) {
      if (!child.contains(shell)) {
        ;(child as HTMLElement).style.setProperty("display", "none", "important")
      }
    }
  }

  let node: HTMLElement | null = shell.parentElement
  for (let depth = 0; node && depth < 5; depth += 1) {
    const parent = node.parentElement
    if (!parent) break

    for (const sibling of Array.from(parent.children)) {
      if (sibling !== node && !sibling.contains(shell)) {
        const el = sibling as HTMLElement
        if (
          el.querySelector("table") ||
          el.querySelector('[data-testid="order-general-section"]') ||
          depth <= 1
        ) {
          el.style.setProperty("display", "none", "important")
        }
      }
    }
    node = parent
  }
}

const SkrepayOrderDetailWidget = () => {
  const { id } = useParams()

  useLayoutEffect(() => {
    enableSkrepayTheme()

    const apply = () => {
      const shell = document.querySelector<HTMLElement>(
        "[data-skrepay-order-detail-shell]"
      )
      if (shell) {
        hideNativeOrderDetail(shell)
      }
    }

    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [id])

  if (!id) {
    return null
  }

  return <OrderDetailPage orderId={id} />
}

export const config = defineWidgetConfig({
  zone: "order.details.before",
})

export default SkrepayOrderDetailWidget
