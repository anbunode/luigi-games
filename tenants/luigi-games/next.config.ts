import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "skrepay.com" },
      { protocol: "https", hostname: "www.skrepay.com" },
      { protocol: "https", hostname: "luigigame.com" },
      { protocol: "https", hostname: "www.luigigame.com" },
      { protocol: "https", hostname: "luigi-games-api1.onrender.com" },
      { protocol: "https", hostname: "*.netlify.app" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ]
  },
}

export default nextConfig
