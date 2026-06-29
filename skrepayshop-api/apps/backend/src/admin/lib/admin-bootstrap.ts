import { installAuthBridge } from "./auth-bridge"

if (typeof window !== "undefined") {
  installAuthBridge()
}
