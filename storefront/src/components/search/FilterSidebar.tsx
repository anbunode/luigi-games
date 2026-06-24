import { ChevronDown, Filter } from "lucide-react"

const filterGroups = [
  "Product type",
  "Platforms",
  "Activation region",
  "Operating System",
  "Genres",
  "Product languages",
]

export function FilterSidebar() {
  return (
    <aside className="w-full shrink-0 lg:w-64">
      <div className="sticky top-[140px] rounded-xl bg-card p-4">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-text-secondary" />
          <h3 className="text-sm font-bold text-text">Filters</h3>
        </div>

        <label className="mb-6 flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            defaultChecked
            className="h-4 w-4 rounded border-white/20 bg-bg-secondary accent-accent"
          />
          <span className="text-sm text-text-secondary">Hide Out of Stock</span>
        </label>

        {filterGroups.map((group) => (
          <div key={group} className="mb-4">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-lg border border-white/8 bg-bg-secondary px-3 py-2.5 text-left text-sm text-text-muted transition-colors hover:border-white/15"
            >
              {group}
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        ))}

        <div className="mb-4">
          <div className="mb-2 flex justify-between text-xs text-text-muted">
            <span>€ 0</span>
            <span>€ MAX</span>
          </div>
          <div className="relative h-1.5 rounded-full bg-bg-secondary">
            <div className="absolute left-0 h-full w-3/4 rounded-full bg-accent" />
            <div className="absolute left-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-accent bg-card" />
            <div className="absolute left-3/4 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-accent bg-card" />
          </div>
        </div>
      </div>
    </aside>
  )
}
