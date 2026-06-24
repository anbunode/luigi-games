import Link from "next/link"
import { Globe, Gamepad2 } from "lucide-react"
import type { Product } from "@/lib/mock-data"

function formatPrice(price: number) {
  return `€${price.toFixed(2)}`
}

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/products/${product.handle}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-card shadow-lg transition-all hover:bg-card-hover hover:shadow-xl hover:shadow-accent/5"
    >
      <div className="relative aspect-[4/3] bg-bg-secondary">
        {product.discount && (
          <span className="absolute left-0 top-3 z-10 rounded-r-md bg-accent px-2 py-0.5 text-xs font-bold text-bg">
            -{product.discount}%
          </span>
        )}
        <div className="flex h-full items-center justify-center">
          <Gamepad2 className="h-12 w-12 text-text-muted/30 transition-colors group-hover:text-accent/30" />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3">
        {product.promoLabel && (
          <span className="mb-1 text-xs font-light text-text-muted">
            {product.promoLabel}
          </span>
        )}
        <h3 className="mb-2 line-clamp-2 text-sm font-medium leading-snug text-text">
          {product.title}
        </h3>
        <div className="mt-auto flex items-center gap-2 text-text-muted">
          <Gamepad2 className="h-3.5 w-3.5" />
          <Globe className="h-3.5 w-3.5" />
        </div>
      </div>

      <div className="flex items-center justify-between bg-accent px-3 py-2">
        {product.originalPrice && (
          <span className="text-xs text-bg/70 line-through">
            {formatPrice(product.originalPrice)}
          </span>
        )}
        <span className="ml-auto text-sm font-bold text-bg">
          {formatPrice(product.price)}
        </span>
      </div>
    </Link>
  )
}
