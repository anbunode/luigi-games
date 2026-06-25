import Link from "next/link"
import {
  Menu,
  Search,
  ShoppingCart,
  User,
} from "lucide-react"
import { siteConfig } from "@/lib/config/site"

export function Header({ storeName = "Luigi Games" }: { storeName?: string }) {
  const label = storeName.toUpperCase()

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-bg-secondary">
      <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20">
            <span className="text-lg font-black text-accent">LG</span>
          </div>
          <span className="hidden text-lg font-bold tracking-tight text-text sm:block">
            {label}
          </span>
        </Link>

        <div className="relative mx-auto w-full max-w-xl flex-1">
          <input
            type="search"
            placeholder="Search for games, gift cards, software..."
            className="w-full rounded-full border border-white/8 bg-card py-2.5 pl-4 pr-11 text-sm text-text placeholder:text-text-muted outline-none transition-colors focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
          />
          <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <button
            type="button"
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-card hover:text-text"
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5" />
          </button>
          <Link
            href={siteConfig.platformLoginUrl}
            className="hidden items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text sm:flex"
            target="_blank"
            rel="noreferrer"
          >
            <User className="h-4 w-4" />
            Panel
          </Link>
          <button
            type="button"
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-card hover:text-text lg:hidden"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
