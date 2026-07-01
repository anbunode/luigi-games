import { useParams } from "react-router-dom"
import { DraftOrdersListPage } from "../../../components/draft-orders/DraftOrdersListPage"

export default function DraftOrderDetailRoute() {
  const { id } = useParams()

  if (!id) {
    return null
  }

  return <DraftOrdersListPage openWorkspaceId={id} />
}
