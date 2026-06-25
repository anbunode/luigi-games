import Link from "next/link"
import type { StorefrontTheme } from "@/lib/theme-types"

interface PromoBannerProps {
  theme: Pick<
    StorefrontTheme,
    "promo_title" | "promo_cta_label" | "promo_cta_url"
  >
}

export function PromoBanner({ theme }: PromoBannerProps) {
  const lines = theme.promo_title.split("\n")

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-4">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900/40 via-card to-emerald-800/30">
        <div className="flex min-h-[120px] items-center justify-between gap-4 px-6 py-6 md:px-10">
          <div>
            <p className="text-lg font-black uppercase leading-tight text-text md:text-2xl">
              {lines.map((line, index) => (
                <span key={`${line}-${index}`}>
                  {line}
                  {index < lines.length - 1 ? <br /> : null}
                </span>
              ))}
            </p>
          </div>
          <div className="hidden h-20 w-20 rounded-full bg-accent/20 md:block" />
          <Link
            href={theme.promo_cta_url || "/search"}
            className="shrink-0 rounded-full bg-text px-6 py-2.5 text-xs font-bold uppercase text-bg transition-opacity hover:opacity-90"
          >
            {theme.promo_cta_label}
          </Link>
        </div>
      </div>
    </section>
  )
}
