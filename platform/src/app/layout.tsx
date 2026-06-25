import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { platformConfig } from "@/lib/config"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

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
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
