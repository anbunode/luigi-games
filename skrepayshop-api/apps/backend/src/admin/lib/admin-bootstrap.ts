import { installAuthBridge } from "./auth-bridge"
import { showOrdersLoadingOverlayIfNeeded } from "./orders-loading-overlay"

if (typeof window !== "undefined") {
  showOrdersLoadingOverlayIfNeeded()
  installAuthBridge()
}
