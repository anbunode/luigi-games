import Link from "next/link"
import Image from "next/image"

interface TopBannerProps {
  imageUrl?: string
  productHandle?: string
}

export function TopBanner({ imageUrl, productHandle }: TopBannerProps) {
  const href = productHandle ? `/products/${productHandle}` : "/search"

  if (!imageUrl) {
    return (
      <div className="relative h-[72px] w-full overflow-hidden bg-bg-secondary">
        <div className="absolute inset-0 bg-gradient-to-r from-bg-secondary via-card/40 to-bg-secondary" />
        <div className="relative mx-auto flex h-full max-w-[1440px] items-center justify-between px-4">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
            Sube una imagen de banner desde el panel → Tema de la tienda
          </p>
          <Link
            href={href}
            className="rounded-full bg-accent px-5 py-2 text-xs font-bold uppercase text-bg transition-colors hover:bg-accent-hover"
          >
            Ver producto
          </Link>
        </div>
      </div>
    )
  }

  return (
    <Link
      href={href}
      className="group relative block w-full overflow-hidden bg-bg-secondary"
      aria-label="Banner promocional"
    >
      <div className="relative mx-auto max-h-[180px] w-full max-w-[1920px]">
        <Image
          src={imageUrl}
          alt="Banner promocional"
          width={1920}
          height={180}
          className="h-auto max-h-[180px] w-full object-cover object-center transition-opacity group-hover:opacity-95"
          priority
          unoptimized
        />
      </div>
    </Link>
  )
}
