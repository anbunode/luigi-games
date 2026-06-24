import Image from "next/image"
import { Gamepad2 } from "lucide-react"
import { SHELL_PLACEHOLDER_IMAGE } from "@/lib/shell-catalog"

interface ProductThumbnailProps {
  title: string
  imageUrl?: string
  className?: string
  iconClassName?: string
}

export function ProductThumbnail({
  title,
  imageUrl = SHELL_PLACEHOLDER_IMAGE,
  className = "",
  iconClassName = "h-12 w-12",
}: ProductThumbnailProps) {
  const src = imageUrl || SHELL_PLACEHOLDER_IMAGE

  if (src.startsWith("/")) {
    return (
      <Image
        src={src}
        alt={title}
        fill
        className={`object-cover ${className}`}
        sizes="(max-width: 768px) 50vw, 25vw"
      />
    )
  }

  return (
    <Image
      src={src}
      alt={title}
      fill
      className={`object-cover ${className}`}
      sizes="(max-width: 768px) 50vw, 25vw"
      unoptimized
    />
  )
}

export function ProductThumbnailFallback({
  iconClassName = "h-12 w-12",
}: {
  iconClassName?: string
}) {
  return (
    <div className="flex h-full items-center justify-center">
      <Gamepad2
        className={`${iconClassName} text-text-muted/30 transition-colors group-hover:text-accent/30`}
      />
    </div>
  )
}
