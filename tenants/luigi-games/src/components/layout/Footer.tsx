import Link from "next/link"
import { Share2, Users, Video, Globe, MessageCircle } from "lucide-react"

const footerColumns = [
  {
    title: "Luigi Games",
    links: ["About us", "Join Luigi Games", "News", "CS2 Sites"],
  },
  {
    title: "Partnership",
    links: [
      "Buy Now on Luigi Games",
      "Sell Now on Luigi Games",
      "Connect with API",
      "Digital Wholesale",
      "Affiliate Program",
    ],
  },
  {
    title: "Policies & Support",
    links: ["Legal page", "Customer Support", "Cookie consents"],
  },
]

export function Footer() {
  return (
    <footer className="mt-auto bg-accent">
      <div className="mx-auto max-w-[1440px] px-4 py-10">
        <div className="mb-10 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-2 text-bg">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bg/20 font-black">
              LG
            </div>
            <span className="text-2xl font-bold tracking-tight">LUIGI GAMES</span>
          </div>

          <div className="max-w-md">
            <p className="mb-3 text-sm text-bg/90">
              Sign up to our newsletter for discount codes and exclusive offers.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="e-mail"
                className="flex-1 rounded-full border border-bg/30 bg-bg/10 px-4 py-2 text-sm text-bg placeholder:text-bg/60 outline-none"
              />
              <button
                type="button"
                className="shrink-0 rounded-full border border-bg px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-bg/10"
              >
                Stay Updated
              </button>
            </div>
          </div>
        </div>

        <div className="mb-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-sm font-bold text-bg">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-sm text-bg/80 transition-colors hover:text-bg"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="mb-3 text-sm font-bold text-bg">Join our community</h4>
            <div className="mb-4 inline-flex rounded-full border border-bg/40 bg-bg/10 px-3 py-1 text-xs font-semibold text-bg">
              LUIGI DEAL HUNTER
            </div>
            <div className="flex gap-3">
              {[Share2, Users, Video, Globe, MessageCircle].map((Icon, i) => (
                <Link
                  key={i}
                  href="#"
                  className="text-bg/80 transition-colors hover:text-bg"
                >
                  <Icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-bg/20 pt-6 text-center text-xs text-bg/70">
          <p>© 2026 Luigi Games. All Rights Reserved.</p>
          <p className="mt-1">
            This site is protected by reCAPTCHA and the Google Privacy Policy and
            Terms of Service apply.
          </p>
        </div>
      </div>
    </footer>
  )
}
