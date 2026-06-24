export function PromoBanner() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-4">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900/40 via-card to-emerald-800/30">
        <div className="flex min-h-[120px] items-center justify-between gap-4 px-6 py-6 md:px-10">
          <div>
            <p className="text-lg font-black uppercase leading-tight text-text md:text-2xl">
              Football summer
              <br />
              starts here
            </p>
          </div>
          <div className="hidden h-20 w-20 rounded-full bg-accent/20 md:block" />
          <button
            type="button"
            className="shrink-0 rounded-full bg-text px-6 py-2.5 text-xs font-bold uppercase text-bg transition-opacity hover:opacity-90"
          >
            Enter the fan zone
          </button>
        </div>
      </div>
    </section>
  )
}
