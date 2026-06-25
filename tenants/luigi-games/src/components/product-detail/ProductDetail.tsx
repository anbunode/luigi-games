"use client"

import { useState } from "react"
import {
  Globe,
  Heart,
  Share2,
  Star,
} from "lucide-react"
import type { Product } from "@/lib/mock-data"
import { ProductThumbnail } from "@/components/products/ProductThumbnail"
import { SideBanner } from "@/components/home/SideBanner"

interface ProductGalleryProps {
  product: Product
}

export function ProductGallery({ product }: ProductGalleryProps) {
  const [activePlatform, setActivePlatform] = useState("Steam")
  const platforms = ["Steam", "PS", "Xbox", "EA"]

  return (
    <div className="flex-1">
      <nav className="mb-4 text-xs text-text-muted">
        <span>Home</span>
        <span className="mx-1.5">›</span>
        <span>Simulation</span>
        <span className="mx-1.5">›</span>
        <span className="text-text-secondary">{product.title}</span>
      </nav>

      <div className="rounded-xl bg-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded bg-bg-secondary px-2 py-0.5 text-xs font-bold text-text">
              PEGI 3
            </span>
            <div className="flex items-center gap-1 text-discount">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
              <span className="ml-1 text-xs text-text-secondary">
                {product.rating ?? 5.0} ({product.reviewCount ?? 0} reviews)
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg p-2 text-text-muted hover:bg-bg-secondary hover:text-text"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded-lg p-2 text-text-muted hover:bg-bg-secondary hover:text-text"
            >
              <Heart className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mb-4 flex gap-2">
          {product.genres?.map((genre) => (
            <span
              key={genre}
              className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium uppercase text-text-muted"
            >
              {genre}
            </span>
          ))}
        </div>

        <div className="relative mb-6 aspect-video overflow-hidden rounded-xl bg-bg-secondary">
          <ProductThumbnail title={product.title} imageUrl={product.imageUrl} />
        </div>

        <div className="mb-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">
            Platform
          </p>
          <div className="flex gap-2">
            {platforms.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setActivePlatform(p)}
                className={`flex h-10 w-10 items-center justify-center rounded-full border text-xs font-bold transition-colors ${
                  activePlatform === p
                    ? "border-accent bg-accent-muted text-accent"
                    : "border-white/10 text-text-muted hover:border-white/20"
                }`}
              >
                {p.slice(0, 2)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">
            Edition
          </p>
          <button
            type="button"
            className="rounded-lg border border-white/10 bg-bg-secondary px-4 py-2 text-sm text-text"
          >
            Standard Edition
          </button>
        </div>
      </div>
    </div>
  )
}

interface PurchaseSidebarProps {
  product: Product
}

export function PurchaseSidebar({ product }: PurchaseSidebarProps) {
  return (
    <aside className="w-full shrink-0 lg:w-[340px]">
      <div className="sticky top-[140px] rounded-xl bg-card p-4">
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-discount/10 px-3 py-2 text-xs text-discount">
          <Globe className="h-4 w-4" />
          Can be activated in: Venezuela
        </div>

        <h1 className="mb-3 text-lg font-bold leading-snug text-text">
          {product.title}
        </h1>

        <div className="mb-4 flex items-center gap-2 text-xs text-text-muted">
          <span className="rounded bg-accent/20 px-2 py-0.5 font-semibold text-accent">
            PROMOTED OFFER
          </span>
          <span>FOXNGAME</span>
          <span className="text-discount">97.86% superb</span>
        </div>

        <div className="mb-4 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-text">
            €{product.price.toFixed(2)}
          </span>
          {product.originalPrice && (
            <>
              <span className="rounded bg-discount px-1.5 py-0.5 text-xs font-bold text-bg">
                -{product.discount}%
              </span>
              <span className="text-sm text-text-muted line-through">
                €{product.originalPrice.toFixed(2)}
              </span>
            </>
          )}
        </div>

        <div className="mb-4 rounded-lg border border-pass/40 bg-pass/10 p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-text">€1.81</span>
            <span className="text-xs text-pass">-€0.20</span>
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            Save with <span className="font-bold text-pass">LUIGI PASS</span>{" "}
            <button type="button" className="text-accent hover:underline">
              Details
            </button>
          </p>
        </div>

        <p className="mb-4 text-xs text-text-muted">
          16 more offers available starting from €1.77
        </p>

        <button
          type="button"
          className="mb-3 w-full rounded-lg bg-[#0070BA] py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Buy with PayPal
        </button>
        <button
          type="button"
          className="mb-4 w-full rounded-lg bg-accent py-3 text-sm font-bold uppercase text-bg transition-colors hover:bg-accent-hover"
        >
          Add to cart
        </button>

        <p className="mb-4 text-center text-xs text-text-muted">
          🔒 Your transaction is secure
        </p>

        <div className="flex justify-between border-t border-white/8 pt-4 text-center text-[10px] uppercase text-text-muted">
          <span>Key activation</span>
          <span>Notes</span>
          <span>Languages</span>
        </div>
      </div>
    </aside>
  )
}

interface ProductDetailLayoutProps {
  product: Product
}

export function ProductDetailLayout({ product }: ProductDetailLayoutProps) {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6">
      <div className="flex gap-4">
        <SideBanner variant="left" />
        <div className="flex min-w-0 flex-1 flex-col gap-6 lg:flex-row">
          <ProductGallery product={product} />
          <PurchaseSidebar product={product} />
        </div>
        <SideBanner variant="right" />
      </div>
    </div>
  )
}
