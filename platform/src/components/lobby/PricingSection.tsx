import Link from "next/link"
import { Check } from "lucide-react"
import { plans } from "@/lib/config"

export function PricingSection() {
  return (
    <section id="planes" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
            Planes
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Suscripciones que activan capacidades.
          </h2>
          <p className="mt-4 text-lg text-ink-muted">
            Empieza gratis y desbloquea scrapers, apps e integraciones según
            crezca tu operación.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const featured = "featured" in plan && plan.featured

            return (
            <article
              key={plan.name}
              className={`rounded-3xl border p-8 ${
                featured
                  ? "border-brand bg-brand text-white shadow-[0_24px_60px_rgba(0,128,96,0.22)]"
                  : "border-line bg-surface-soft"
              }`}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.18em] opacity-80">
                {plan.name}
              </p>
              <p className="mt-4 text-4xl font-semibold">{plan.price}</p>
              <p
                className={`mt-3 text-sm leading-relaxed ${
                  featured ? "text-white/85" : "text-ink-muted"
                }`}
              >
                {plan.description}
              </p>
              <ul className="mt-8 space-y-3">
                {plan.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <Check
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        featured ? "text-white" : "text-brand"
                      }`}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition-colors ${
                  featured
                    ? "bg-white text-brand hover:bg-brand-light"
                    : "bg-brand text-white hover:bg-brand-dark"
                }`}
              >
                Elegir plan
              </Link>
            </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
