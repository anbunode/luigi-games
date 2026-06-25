import { redirect } from "next/navigation"
import { platformConfig } from "@/lib/config"

export default function PanelRedirectPage() {
  redirect(platformConfig.adminUrl)
}
