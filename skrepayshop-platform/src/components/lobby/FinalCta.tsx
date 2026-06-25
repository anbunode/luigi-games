import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function FinalCta() {
  return (
    <section className="bg-brand-dark py-20 text-white">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Empieza hoy. Escala mañana.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
          Tu lobby, tu login y tu panel oficial ya están listos. El ecosistema
          crece contigo: apps, scrapers y suscripciones se irán activando paso a
          paso.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-brand-dark transition-transform hover:scale-[1.02]"
        >
          Entrar a mi cuenta
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
