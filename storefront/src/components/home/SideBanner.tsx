interface SideBannerProps {
  variant?: "left" | "right"
}

export function SideBanner({ variant = "left" }: SideBannerProps) {
  return (
    <aside
      className={`hidden w-[140px] shrink-0 xl:block ${
        variant === "right" ? "order-last" : ""
      }`}
    >
      <div className="sticky top-[140px] flex h-[480px] flex-col overflow-hidden rounded-xl bg-card">
        <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-card to-bg-secondary p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Sponsored
          </p>
          <p className="mt-2 text-xs font-bold uppercase leading-tight text-text">
            {variant === "left"
              ? "Still doing it the hard way?"
              : "Upgrade your adventures"}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-10 rounded bg-bg-secondary" />
            ))}
          </div>
          <button
            type="button"
            className="mt-4 rounded-full bg-accent px-4 py-1.5 text-[10px] font-bold uppercase text-bg"
          >
            {variant === "left" ? "Get started" : "Shop now"}
          </button>
        </div>
      </div>
    </aside>
  )
}
