import { HeroSection } from "@/components/home/HeroSection"
import { PromoBanner } from "@/components/home/PromoBanner"
import { BestsellersSection } from "@/components/home/BestsellersSection"
import { HeroCarousel } from "@/components/home/HeroCarousel"
import { CategoryPills } from "@/components/home/CategoryPills"
import { ProductListSection } from "@/components/home/ProductListSection"
import { GenreGrid } from "@/components/home/GenreGrid"
import { listProducts } from "@/lib/medusa/products"

export default async function HomePage() {
  const catalog = await listProducts({ limit: 24 })

  const recommended = catalog.products.slice(0, 4)
  const bestsellers = catalog.products.slice(0, 12)
  const featured = catalog.products.slice(4, 16)
  const listItems = catalog.products.slice(0, 6)

  return (
    <>
      <HeroSection recommended={recommended} />
      <PromoBanner />
      <BestsellersSection products={bestsellers} />
      <BestsellersSection title="Featured deals" products={featured} />
      <HeroCarousel />
      <CategoryPills />
      <ProductListSection products={listItems} />
      <GenreGrid />
    </>
  )
}
