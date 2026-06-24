import Link from "next/link"
import { Gamepad2, Globe } from "lucide-react"
import type { Product } from "@/lib/mock-data"

function formatPrice(price: number) {
  return `€${price.toFixed(2)}`
}

interface ProductCardRecommendedProps {
  product: Product
}

export function ProductCardRecommended({ product }: ProductCardRecommendedProps) {
  return (
    <Link
      href={`/products/${product.handle}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-card shadow-lg transition-all hover:bg-card-hover"
    >
      <div className="relative aspect-square bg-bg-secondary">
        <div className="flex h-full items-center justify-center">
          <Gamepad2 className="h-10 w-10 text-text-muted/30 group-hover:text-accent/30" />
        </div>
      </div>

      <div className="p-2.5">
        <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
          {product.type}
        </span>
        <h3 className="mt-0.5 line-clamp-2 text-xs font-medium text-text">
          {product.title}
        </h3>
        <div className="mt-1.5 flex gap-1.5 text-text-muted">
          <Gamepad2 className="h-3 w-3" />
          <Globe className="h-3 w-3" />
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between bg-accent px-2.5 py-1.5">
        <span className="text-[10px] text-bg/80">33:58</span>
        <span className="text-sm font-bold text-bg">
          {formatPrice(product.price)}
        </span>
      </div>
    </Link>
  )
}
