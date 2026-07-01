import { useLayoutEffect } from "react"
import { DraftOrdersListPage } from "./DraftOrdersListPage"
import { installAuthBridge } from "../../lib/auth-bridge"

export function DraftOrderDetailPage({ id }: { id: string }) {
  useLayoutEffect(() => {
    installAuthBridge()
  }, [])

  return <DraftOrdersListPage openWorkspaceId={id} />
}

export default DraftOrderDetailPage
