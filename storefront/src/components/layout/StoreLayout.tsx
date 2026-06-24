import { TopBanner } from "./TopBanner"
import { Header } from "./Header"
import { SubNav } from "./SubNav"
import { Footer } from "./Footer"
import { ChatWidget } from "./ChatWidget"

export function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBanner />
      <Header />
      <SubNav />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatWidget />
    </>
  )
}
