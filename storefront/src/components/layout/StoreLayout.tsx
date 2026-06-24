import { TopBanner } from "./TopBanner"
import { Header } from "./Header"
import { SubNav } from "./SubNav"
import { Footer } from "./Footer"
import { ChatWidget } from "./ChatWidget"
import { ThemeVariables } from "@/components/theme/ThemeVariables"
import { getStorefrontTheme } from "@/lib/medusa/theme"

export async function StoreLayout({ children }: { children: React.ReactNode }) {
  const theme = await getStorefrontTheme()

  return (
    <>
      <ThemeVariables theme={theme} />
      <TopBanner
        imageUrl={theme.main_banner_image_url}
        productHandle={theme.main_banner_product_handle}
      />
      <Header storeName={theme.store_name} />
      <SubNav />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatWidget />
    </>
  )
}
