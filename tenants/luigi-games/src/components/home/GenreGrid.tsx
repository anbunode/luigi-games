"use client"

import { useState } from "react"
import {
  Compass,
  Crosshair,
  Gamepad2,
  Glasses,
  Monitor,
  Zap,
} from "lucide-react"
import { genreTiles } from "@/lib/mock-data"

const iconMap = {
  monitor: Monitor,
  gamepad: Gamepad2,
  crosshair: Crosshair,
  zap: Zap,
  compass: Compass,
  glasses: Glasses,
}

const tabs = ["GENRES", "PLATFORMS", "SOFTWARE"]

export function GenreGrid() {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-8">
      <div className="mb-4 flex gap-2">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(i)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
              activeTab === i
                ? "border-accent text-accent"
                : "border-white/10 text-text-muted hover:text-text-secondary"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
        {genreTiles.map((tile) => {
          const Icon = iconMap[tile.icon as keyof typeof iconMap]
          return (
            <button
              key={tile.label}
              type="button"
              className="group flex aspect-[3/4] flex-col items-center justify-between rounded-xl p-4 transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: tile.color }}
            >
              <Icon className="h-10 w-10 text-white/80 transition-colors group-hover:text-white" />
              <span className="text-center text-xs font-bold uppercase tracking-wide text-white">
                {tile.label}
              </span>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        className="mt-6 w-full text-center text-sm font-medium uppercase tracking-wider text-text-secondary transition-colors hover:text-accent"
      >
        View more
      </button>
    </section>
  )
}
