import { useParams } from "react-router-dom"
import DraftOrderComposer from "../../../components/draft-orders/DraftOrderComposer"

const DraftOrderDetailPage = () => {
  const { id } = useParams()

  if (!id) {
    return null
  }

  return <DraftOrderComposer draftId={id} mode="edit" />
}

export default DraftOrderDetailPage
