import { useParams } from "react-router-dom"
import { DraftOrderDetailPage } from "../../../components/draft-orders/DraftOrderDetailPage"

const DraftOrderDetailRoute = () => {
  const { id } = useParams()

  if (!id) {
    return null
  }

  return <DraftOrderDetailPage id={id} />
}

export default DraftOrderDetailRoute
