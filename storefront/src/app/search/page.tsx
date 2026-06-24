import { FilterSidebar } from "@/components/search/FilterSidebar"
import { SearchResults } from "@/components/search/SearchResults"
import { listProducts } from "@/lib/medusa/products"

export const metadata = {
  title: "Search — Luigi Games",
}

export default async function SearchPage() {
  const { products, count } = await listProducts({ limit: 20 })

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        <FilterSidebar />
        <SearchResults products={products} count={count} />
      </div>
    </div>
  )
}
