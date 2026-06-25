import { ProductCardList } from "@/components/products/ProductCardList"
import type { Product } from "@/lib/mock-data"
import { ChevronDown } from "lucide-react"

interface SearchResultsProps {
  products: Product[]
  count: number
}

export function SearchResults({ products, count }: SearchResultsProps) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-secondary">
          <span className="font-semibold text-text">{count}+</span> results
          found
        </p>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-white/8 bg-card px-3 py-2 text-sm text-text-secondary"
        >
          Sort by Bestsellers
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 rounded-full bg-card px-3 py-1 text-xs text-text-secondary">
          Hide Out of Stock
          <button type="button" className="ml-1 text-text-muted hover:text-text">
            ×
          </button>
        </span>
        <button type="button" className="text-xs text-accent hover:underline">
          Reset all filters
        </button>
      </div>

      <div className="space-y-3">
        {products.map((product) => (
          <ProductCardList key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
