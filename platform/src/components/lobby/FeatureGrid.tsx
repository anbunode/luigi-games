import { features } from "@/lib/config"

export function FeatureGrid() {
  return (
    <section id="producto" className="bg-surface-warm py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
            Producto
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Un ecosistema completo, no solo una tienda.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted">
            Construido sobre Medusa y pensado para escalar como Shopify: panel,
            storefront, suscripciones y marketplace de capacidades.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-3xl border border-line bg-white p-8 shadow-[0_20px_60px_rgba(26,26,26,0.04)] transition-transform hover:-translate-y-1"
            >
              <h3 className="text-xl font-semibold text-ink">{feature.title}</h3>
              <p className="mt-3 leading-relaxed text-ink-muted">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
