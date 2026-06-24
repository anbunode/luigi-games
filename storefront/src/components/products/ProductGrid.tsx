import Link from "next/link"
import type { Product } from "@/lib/mock-data"
import { ProductCard } from "./ProductCard"

interface ProductGridProps {
  products: Product[]
  columns?: 4 | 6
}

export function ProductGrid({ products, columns = 6 }: ProductGridProps) {
  const gridClass =
    columns === 6
      ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
      : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"

  return (
    <div className={`grid gap-3 ${gridClass}`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

interface SectionHeaderProps {
  title: string
  href?: string
  label?: string
}

export function SectionHeader({
  title,
  href = "/search",
  label = "See all",
}: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary">
        {title}
      </h2>
      <Link
        href={href}
        className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-bg transition-colors hover:bg-accent-hover"
      >
        {label}
      </Link>
    </div>
  )
}
