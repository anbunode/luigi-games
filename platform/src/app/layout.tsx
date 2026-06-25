import type { Metadata } from "next"
import "./globals.css"
import { platformConfig } from "@/lib/config"

export const metadata: Metadata = {
  title: {
    default: platformConfig.name,
    template: `%s · ${platformConfig.name}`,
  },
  description: platformConfig.description,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
