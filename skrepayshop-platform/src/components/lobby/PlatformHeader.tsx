import Link from "next/link"
import { platformConfig, navLinks } from "@/lib/config"

export function PlatformHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
            SS
          </span>
          <span className="text-sm font-semibold tracking-tight sm:text-base">
            {platformConfig.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-white/80 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="rounded-full px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 sm:px-4"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-ink transition-transform hover:scale-[1.02] sm:px-4"
          >
            Empezar gratis
          </Link>
        </div>
      </div>
    </header>
  )
}
