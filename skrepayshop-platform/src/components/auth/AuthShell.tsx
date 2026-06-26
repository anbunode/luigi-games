import Link from "next/link"
import { platformConfig } from "@/lib/config"

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-surface-warm lg:grid lg:grid-cols-2">
      <section className="relative hidden overflow-hidden lg:block">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster={platformConfig.heroPoster}
        >
          <source src={platformConfig.heroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/55 to-brand-dark/80" />
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-sm font-bold text-brand">
              SS
            </span>
            <span className="font-semibold">{platformConfig.name}</span>
          </Link>
          <div className="max-w-md">
            <p className="text-sm uppercase tracking-[0.2em] text-white/70">
              Ecosistema SkrepayShop
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight">
              Tu tienda, tu panel, tu marca.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/80">
              Crea tu cuenta, verifica tu correo y empieza a configurar tu
              negocio en minutos.
            </p>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2 text-ink">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
                SS
              </span>
              <span className="font-semibold">{platformConfig.name}</span>
            </Link>
          </div>

          <div className="rounded-[2rem] border border-line bg-white p-8 shadow-[0_24px_80px_rgba(26,26,26,0.08)]">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {description}
            </p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </section>
    </div>
  )
}
