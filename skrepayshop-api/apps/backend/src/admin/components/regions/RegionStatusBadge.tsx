import { Badge } from "@medusajs/ui"

type Props = {
  status: "active" | "draft"
}

export function RegionStatusBadge({ status }: Props) {
  if (status === "active") {
    return <Badge color="green">Activo</Badge>
  }
  return <Badge color="grey">Borrador</Badge>
}
