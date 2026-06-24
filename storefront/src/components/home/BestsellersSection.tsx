import { ProductGrid, SectionHeader } from "@/components/products/ProductGrid"
import type { Product } from "@/lib/mock-data"

interface BestsellersSectionProps {
  title?: string
  products: Product[]
}

export function BestsellersSection({
  title = "Bestsellers",
  products,
}: BestsellersSectionProps) {
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-6">
      <SectionHeader title={title} />
      <ProductGrid products={products} columns={6} />
    </section>
  )
}
