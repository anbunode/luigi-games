import Link from "next/link"
import { ExternalLink, LayoutGrid } from "lucide-react"
import { navLinks } from "@/lib/mock-data"

export function SubNav() {
  return (
    <nav className="border-b border-white/8 bg-bg-secondary/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1440px] items-center gap-2 overflow-x-auto px-4 py-2 scrollbar-none">
        <Link
          href="/search"
          className="flex shrink-0 items-center gap-2 rounded-lg bg-card px-4 py-2 text-xs font-semibold uppercase tracking-wide text-text transition-colors hover:bg-card-hover"
        >
          <LayoutGrid className="h-4 w-4" />
          Products
        </Link>

        <div className="flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="flex shrink-0 items-center gap-1 px-3 py-2 text-xs font-medium uppercase tracking-wide text-text-secondary transition-colors hover:text-text"
            >
              {link.label}
              {link.external && (
                <ExternalLink className="h-3 w-3 opacity-50" />
              )}
            </Link>
          ))}
        </div>

        <Link
          href="/pass"
          className="ml-auto flex shrink-0 items-center rounded-full bg-pass px-4 py-1.5 text-xs font-black uppercase tracking-wider text-bg transition-opacity hover:opacity-90"
        >
          Luigi Pass
        </Link>
      </div>
    </nav>
  )
}
