export function TopBanner() {
  return (
    <div className="relative h-[72px] w-full overflow-hidden bg-bg-secondary">
      <div className="absolute inset-0 bg-gradient-to-r from-bg-secondary via-card/40 to-bg-secondary" />
      <div className="relative mx-auto flex h-full max-w-[1440px] items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-32 rounded-lg bg-card/60" />
          <div className="hidden sm:block">
            <p className="text-xs font-bold uppercase tracking-wider text-text">
              More than just a race
            </p>
            <p className="text-[10px] uppercase text-accent">Up to 34% off</p>
          </div>
        </div>
        <div className="hidden h-14 w-48 rounded-lg bg-card/40 md:block" />
        <button
          type="button"
          className="rounded-full bg-accent px-5 py-2 text-xs font-bold uppercase text-bg transition-colors hover:bg-accent-hover"
        >
          Buy now
        </button>
      </div>
    </div>
  )
}
