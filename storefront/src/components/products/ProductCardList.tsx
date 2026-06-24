import Link from "next/link"
import { Heart, Gamepad2, Globe } from "lucide-react"
import type { Product } from "@/lib/mock-data"

function formatPrice(price: number) {
  return `€${price.toFixed(2)}`
}

interface ProductCardListProps {
  product: Product
  showReleaseDate?: boolean
}

export function ProductCardList({
  product,
  showReleaseDate = false,
}: ProductCardListProps) {
  return (
    <div className="group flex items-stretch gap-4 rounded-xl bg-card p-3 transition-colors hover:bg-card-hover">
      {showReleaseDate && product.releaseDate && (
        <div className="flex w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-accent text-center">
          <span className="text-lg font-black leading-none text-bg">
            {product.releaseDate.split(" ")[0]}
          </span>
          <span className="text-[10px] font-bold uppercase text-bg/80">
            {product.releaseDate.split(" ")[1]}
          </span>
        </div>
      )}

      <Link
        href={`/products/${product.handle}`}
        className="relative h-24 w-36 shrink-0 overflow-hidden rounded-lg bg-bg-secondary"
      >
        <div className="flex h-full items-center justify-center">
          <Gamepad2 className="h-8 w-8 text-text-muted/30" />
        </div>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <Link
          href={`/products/${product.handle}`}
          className="line-clamp-1 text-sm font-medium text-text hover:text-accent"
        >
          {product.title}
        </Link>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <Gamepad2 className="h-3.5 w-3.5 text-text-muted" />
          <Globe className="h-3.5 w-3.5 text-text-muted" />
          {product.genres?.map((genre) => (
            <span
              key={genre}
              className="rounded border border-white/10 px-2 py-0.5 text-[10px] font-medium uppercase text-text-muted"
            >
              {genre}
            </span>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {product.discount !== undefined && (
          <div className="hidden items-center gap-2 sm:flex">
            <div className="rounded border border-accent px-3 py-1.5 text-sm font-bold text-text">
              {formatPrice(product.price)}
            </div>
            <span className="rounded bg-discount px-1.5 py-0.5 text-xs font-bold text-bg">
              -{product.discount}%
            </span>
          </div>
        )}
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full border border-accent px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent-muted"
        >
          Add to wishlist
          <Heart className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
