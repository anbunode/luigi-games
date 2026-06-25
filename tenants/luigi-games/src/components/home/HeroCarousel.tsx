"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const slides = [
  {
    title: "Compare CS2 Websites and Find the Best Deals",
    subtitle: "Skins, cases & more",
    cta: "Get skins",
  },
  {
    title: "Pre-order the hottest titles",
    subtitle: "Exclusive early access",
    cta: "Pre-order now",
  },
]

export function HeroCarousel() {
  const [current, setCurrent] = useState(0)
  const slide = slides[current]

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-6">
      <div className="relative overflow-hidden rounded-2xl bg-card">
        <div className="flex min-h-[280px] items-center px-4 md:px-8">
          <button
            type="button"
            onClick={() =>
              setCurrent((c) => (c === 0 ? slides.length - 1 : c - 1))
            }
            className="absolute left-4 z-10 rounded-full p-2 text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 md:flex-row md:justify-between">
            <div className="flex gap-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`rounded-xl bg-bg-secondary ${
                    i === 2
                      ? "h-32 w-24 -rotate-6"
                      : "h-24 w-20 rotate-6 opacity-70"
                  }`}
                />
              ))}
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-lg font-bold text-text md:text-xl">
                {slide.title}
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                {slide.subtitle}
              </p>
              <button
                type="button"
                className="mt-4 rounded-full bg-accent px-6 py-2 text-sm font-bold uppercase text-bg transition-colors hover:bg-accent-hover"
              >
                {slide.cta}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setCurrent((c) => (c === slides.length - 1 ? 0 : c + 1))
            }
            className="absolute right-4 z-10 rounded-full p-2 text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        <div className="flex justify-center gap-2 pb-4">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === current ? "bg-accent" : "bg-text-muted"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
