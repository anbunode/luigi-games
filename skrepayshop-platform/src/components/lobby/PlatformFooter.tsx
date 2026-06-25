import Link from "next/link"
import { platformConfig } from "@/lib/config"

export function PlatformFooter() {
  return (
    <footer className="border-t border-line bg-surface-warm py-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <p className="text-lg font-semibold text-ink">{platformConfig.name}</p>
          <p className="mt-1 text-sm text-ink-muted">
            Plataforma SaaS multi-tienda sobre Medusa.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-ink-muted">
          <Link href="/login" className="hover:text-ink">
            Iniciar sesión
          </Link>
          <a
            href={platformConfig.demoStoreUrl}
            target="_blank"
            rel="noreferrer"
            className="hover:text-ink"
          >
            Tienda demo
          </a>
          <a
            href="/panel"
            className="hover:text-ink"
          >
            Panel
          </a>
        </div>
      </div>
    </footer>
  )
}
