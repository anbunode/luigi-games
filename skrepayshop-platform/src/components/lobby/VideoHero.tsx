"use client"

import Link from "next/link"
import { ArrowRight, PlayCircle } from "lucide-react"
import { platformConfig } from "@/lib/config"

export function VideoHero() {
  return (
    <section className="relative min-h-[92vh] overflow-hidden">
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

      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/80" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,128,96,0.28),transparent_42%)]" />

      <div className="relative mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-center px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-white/90 backdrop-blur-sm">
            <PlayCircle className="h-4 w-4 text-brand-light" />
            Plataforma SaaS multi-tienda
          </p>

          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-7xl">
            Las marcas que quieren crecer,
            <span className="block text-brand-light">crecen aquí.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
            {platformConfig.tagline} Lanza tu tienda, conecta apps, importa
            catálogos masivos y gestiona todo desde un panel unificado.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-brand-dark hover:shadow-[0_20px_40px_rgba(0,128,96,0.35)]"
            >
              Crear mi tienda
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#planes"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/15"
            >
              Ver planes
            </a>
          </div>

          <div className="mt-12 grid max-w-2xl grid-cols-3 gap-4 border-t border-white/10 pt-8">
            {[
              ["Multi-tenant", "Listo desde hoy"],
              ["Medusa", "Motor open source"],
              ["Apps + Scrapers", "Por suscripción"],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-lg font-semibold text-white">{label}</p>
                <p className="mt-1 text-sm text-white/65">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
