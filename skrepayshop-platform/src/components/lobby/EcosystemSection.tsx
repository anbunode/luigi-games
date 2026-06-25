import Link from "next/link"
import { Boxes, CreditCard, LayoutDashboard, Sparkles } from "lucide-react"
import { platformConfig } from "@/lib/config"

const ecosystemItems = [
  {
    icon: LayoutDashboard,
    title: "Panel oficial",
    description: "Gestiona productos, tema, pedidos y configuración de tu tenant.",
  },
  {
    icon: Boxes,
    title: "Storefront premium",
    description: "Tu tienda pública con diseño gaming y editor visual integrado.",
  },
  {
    icon: Sparkles,
    title: "Apps y scrapers",
    description: "Funciones premium activables según el plan de suscripción.",
  },
  {
    icon: CreditCard,
    title: "Monetización",
    description: "Pagos, terminales y upsells listos para potenciar ingresos.",
  },
]

export function EcosystemSection() {
  return (
    <section id="ecosistema" className="bg-surface-soft py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
              Ecosistema
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Todo conectado. Todo bajo tu cuenta.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-muted">
              El multi-tenant ya empieza con usuario y contraseña. Cada login
              desbloquea el panel, la tienda y las capacidades contratadas.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-flex rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              Acceder al panel
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {ecosystemItems.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-line bg-white p-6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-light text-brand">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-ink">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-line bg-white p-6 text-sm text-ink-muted">
          <p>
            <span className="font-medium text-ink">Panel comerciante:</span>{" "}
            <a
              href={platformConfig.panelUrl}
              className="text-brand hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              {platformConfig.panelUrl}
            </a>
          </p>
          <p className="mt-2">
            <span className="font-medium text-ink">Acceso directo:</span>{" "}
            <Link href="/panel" className="text-brand hover:underline">
              {platformConfig.panelUrl}
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
