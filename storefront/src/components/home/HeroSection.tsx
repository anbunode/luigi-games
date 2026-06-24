import Link from "next/link"
import { ProductCardRecommended } from "@/components/products/ProductCardRecommended"
import type { StorefrontTheme } from "@/lib/theme-types"
import { SideBanner } from "./SideBanner"
import type { Product } from "@/lib/mock-data"

interface HeroSectionProps {
  recommended: Product[]
  theme: Pick<
    StorefrontTheme,
    | "hero_title"
    | "hero_subtitle"
    | "hero_badge"
    | "hero_cta_label"
    | "hero_cta_url"
  >
}

export function HeroSection({ recommended, theme }: HeroSectionProps) {
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-6">
      <div className="flex gap-4">
        <SideBanner variant="left" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex-1">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-text-secondary">
                Hot stuff
              </h2>
              <div className="overflow-hidden rounded-xl bg-card shadow-lg">
                <div className="relative aspect-[16/9] bg-gradient-to-br from-bg-secondary via-card to-bg">
                  <div className="absolute inset-0 flex flex-col items-center justify-end bg-gradient-to-t from-bg via-bg/60 to-transparent p-6 text-center">
                    <p className="text-2xl font-black uppercase tracking-wide text-text md:text-3xl">
                      {theme.hero_title}
                    </p>
                    <p className="mt-1 text-sm font-medium uppercase text-accent">
                      {theme.hero_subtitle}
                    </p>
                    <p className="mt-2 text-xs text-text-secondary">
                      {theme.hero_badge}
                    </p>
                    <Link
                      href={theme.hero_cta_url || "/search"}
                      className="mt-4 rounded-full bg-accent px-8 py-2.5 text-sm font-bold uppercase text-bg transition-colors hover:bg-accent-hover"
                    >
                      {theme.hero_cta_label}
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-[280px]">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-text-secondary">
                Recommended for you
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {recommended.map((product) => (
                  <ProductCardRecommended key={product.id} product={product} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <SideBanner variant="right" />
      </div>
    </section>
  )
}
