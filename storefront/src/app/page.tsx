import { HeroSection } from "@/components/home/HeroSection"
import { PromoBanner } from "@/components/home/PromoBanner"
import { BestsellersSection } from "@/components/home/BestsellersSection"
import { HeroCarousel } from "@/components/home/HeroCarousel"
import { CategoryPills } from "@/components/home/CategoryPills"
import { ProductListSection } from "@/components/home/ProductListSection"
import { GenreGrid } from "@/components/home/GenreGrid"
import { listProducts } from "@/lib/medusa/products"
import { getStorefrontTheme } from "@/lib/medusa/theme"

export default async function HomePage() {
  const [catalog, theme] = await Promise.all([
    listProducts({ limit: 24 }),
    getStorefrontTheme(),
  ])

  const recommended = catalog.products.slice(0, 4)
  const bestsellers = catalog.products.slice(0, 12)
  const featured = catalog.products.slice(4, 16)
  const listItems = catalog.products.slice(0, 6)

  return (
    <>
      <HeroSection recommended={recommended} />
      {theme.show_promo_banner ? <PromoBanner theme={theme} /> : null}
      {theme.show_bestsellers ? (
        <BestsellersSection products={bestsellers} />
      ) : null}
      {theme.show_featured_deals ? (
        <BestsellersSection title="Featured deals" products={featured} />
      ) : null}
      {theme.show_hero_carousel ? <HeroCarousel /> : null}
      {theme.show_category_pills ? <CategoryPills /> : null}
      {theme.show_product_list ? (
        <ProductListSection products={listItems} />
      ) : null}
      {theme.show_genre_grid ? <GenreGrid /> : null}
    </>
  )
}
