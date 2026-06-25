"use client"

import { useState } from "react"
import { categoryPills } from "@/lib/mock-data"
import { ChevronRight } from "lucide-react"

export function CategoryPills() {
  const [active, setActive] = useState(1)

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-4">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categoryPills.map((pill, i) => (
          <button
            key={pill}
            type="button"
            onClick={() => setActive(i)}
            className={`flex shrink-0 items-center gap-1 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
              active === i
                ? "border-accent bg-accent-muted text-accent"
                : "border-white/10 bg-card text-text-secondary hover:border-white/20 hover:text-text"
            }`}
          >
            {pill}
            {pill.includes("MYSTERY") && (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        ))}
      </div>
    </section>
  )
}
