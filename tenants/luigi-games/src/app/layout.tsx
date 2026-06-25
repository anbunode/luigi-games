import { Inter } from "next/font/google"
import { StoreLayout } from "@/components/layout/StoreLayout"
import { siteConfig } from "@/lib/config/site"
import "./globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

export const metadata = {
  title: {
    default: `${siteConfig.name} — Digital Gaming Marketplace`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    siteName: siteConfig.name,
    url: siteConfig.url,
    locale: "es_LA",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <StoreLayout>{children}</StoreLayout>
      </body>
    </html>
  )
}
