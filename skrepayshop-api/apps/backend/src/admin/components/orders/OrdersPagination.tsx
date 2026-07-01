import { skrepayColors, skrepayRadius } from "../../lib/skrepay-theme"
import { SkrepayButton } from "./OrdersUi"

type OrdersPaginationProps = {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

export function OrdersPagination({
  page,
  pageSize,
  total,
  onPageChange,
}: OrdersPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : page * pageSize + 1
  const to = Math.min(total, (page + 1) * pageSize)

  return (
    <div
      className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      style={{
        borderTop: `1px solid ${skrepayColors.border}`,
        background: skrepayColors.surfaceRaised,
        borderRadius: `0 0 ${skrepayRadius.md} ${skrepayRadius.md}`,
      }}
    >
      <p className="text-sm" style={{ color: skrepayColors.textMuted }}>
        {total === 0
          ? "Sin resultados"
          : `Mostrando ${from}–${to} de ${total} pedidos`}
      </p>
      <div className="flex items-center gap-2">
        <SkrepayButton
          variant="ghost"
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </SkrepayButton>
        <span className="text-sm" style={{ color: skrepayColors.textMuted }}>
          Página {page + 1} / {totalPages}
        </span>
        <SkrepayButton
          variant="ghost"
          disabled={page + 1 >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
        </SkrepayButton>
      </div>
    </div>
  )
}
