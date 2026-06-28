import { Badge } from "@medusajs/ui"

type Props = {
  status: "active" | "draft"
}

export function RegionStatusBadge({ status }: Props) {
  if (status === "active") {
    return (
      <Badge color="green" size="2xsmall">
        Activo
      </Badge>
    )
  }
  return (
    <Badge color="grey" size="2xsmall">
      Borrador
    </Badge>
  )
}
