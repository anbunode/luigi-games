import { Button, Heading, Text } from "@medusajs/ui"
import { Link } from "react-router-dom"

type DraftOrderEmptyStateProps = {
  createHref?: string
  onCreateClick?: () => void
}

const DraftOrderEmptyState = ({
  createHref = "/borradores?crear=1",
  onCreateClick,
}: DraftOrderEmptyStateProps) => {
  const action = onCreateClick ? (
    <Button size="small" onClick={onCreateClick}>
      Crear pedido
    </Button>
  ) : (
    <Button size="small" asChild>
      <Link to={createHref}>Crear pedido</Link>
    </Button>
  )

  return (
    <div className="flex flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div
        className="text-ui-fg-muted flex size-16 items-center justify-center rounded-full border border-dashed"
        aria-hidden
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M12 11v6M9 14h6" />
        </svg>
      </div>
      <div className="flex max-w-md flex-col gap-2">
        <Heading level="h2">Crea pedidos manualmente</Heading>
        <Text className="text-ui-fg-subtle">
          Usa borradores para armar pedidos por teléfono, B2B o casos especiales
          antes de convertirlos en pedidos reales.
        </Text>
      </div>
      {action}
    </div>
  )
}

export default DraftOrderEmptyState
