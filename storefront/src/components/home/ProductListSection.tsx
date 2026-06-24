import { ProductCardList } from "@/components/products/ProductCardList"
import { SectionHeader } from "@/components/products/ProductGrid"
import type { Product } from "@/lib/mock-data"
import { ChevronDown } from "lucide-react"

interface ProductListSectionProps {
  products: Product[]
  title?: string
}

export function ProductListSection({
  products,
  title = "Pre-orders",
}: ProductListSectionProps) {
  const items = products

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-6">
      <SectionHeader title={title} href="/search?filter=preorder" />
      <div className="space-y-3">
        {items.map((product) => (
          <ProductCardList
            key={product.id}
            product={product}
            showReleaseDate={!!product.releaseDate}
          />
        ))}
      </div>
      <button
        type="button"
        className="mt-6 flex w-full items-center justify-center gap-1 text-sm font-medium uppercase tracking-wider text-text-secondary transition-colors hover:text-accent"
      >
        Load more
        <ChevronDown className="h-4 w-4" />
      </button>
    </section>
  )
}
