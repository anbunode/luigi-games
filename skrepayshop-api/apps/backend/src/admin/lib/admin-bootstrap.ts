import { installAuthBridge } from "./auth-bridge"
import {
  cleanupSkrepayAdminVisualArtifacts,
  isNativeMedusaAdminUiEnabled,
} from "./native-admin-ui"

if (typeof window !== "undefined") {
  if (isNativeMedusaAdminUiEnabled()) {
    cleanupSkrepayAdminVisualArtifacts()
  }

  installAuthBridge()
}
