import {
  ArrowUturnLeft,
  BuildingStorefront,
  MagnifyingGlass,
} from "@medusajs/icons"
import { Avatar, Input, Text, clx } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, NavLink, useLocation } from "react-router-dom"
import { adminFetch } from "../../lib/admin-api"
import {
  getFallbackSettingsNavItems,
  getSettingsNavIcon,
  type SettingsNavItem,
} from "../../lib/settings-sidebar-routes"
import { normalizeAdminPathname } from "../../lib/region-routes"

type SettingsShopifySidebarProps = {
  items: SettingsNavItem[]
}

type StoreSummary = {
  name: string
  subtitle: string | null
}

type UserSummary = {
  name: string
  email: string
  fallback: string
}

async function fetchStoreSummary(): Promise<StoreSummary> {
  const body = await adminFetch<{
    stores: Array<{
      name: string
      metadata?: Record<string, unknown> | null
    }>
  }>("/admin/stores")

  const store = body.stores?.[0]

  if (!store) {
    return { name: "Tienda", subtitle: null }
  }

  const subtitle =
    (store.metadata?.contact_email as string | undefined) ??
    (store.metadata?.business_name as string | undefined) ??
    null

  return {
    name: store.name,
    subtitle,
  }
}

async function fetchUserSummary(): Promise<UserSummary> {
  const body = await adminFetch<{
    user: {
      email: string
      first_name?: string | null
      last_name?: string | null
    }
  }>("/admin/users/me")

  const user = body.user
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ")
  const displayName = name || user.email

  return {
    name: displayName,
    email: user.email,
    fallback: displayName.charAt(0).toUpperCase(),
  }
}

function isNavItemActive(pathname: string, to: string) {
  const current = normalizeAdminPathname(pathname)
  const target = normalizeAdminPathname(to)

  return current === target || current.startsWith(`${target}/`)
}

export function SettingsShopifySidebar({ items }: SettingsShopifySidebarProps) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const [search, setSearch] = useState("")

  const fallbackItems = useMemo(() => getFallbackSettingsNavItems(t), [t])
  const navItems = items.length > 0 ? items : fallbackItems

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return navItems
    }

    return navItems.filter((item) => item.label.toLowerCase().includes(query))
  }, [navItems, search])

  const storeQuery = useQuery({
    queryKey: ["skrepay", "settings-sidebar", "store"],
    queryFn: fetchStoreSummary,
    staleTime: 60_000,
  })

  const userQuery = useQuery({
    queryKey: ["skrepay", "settings-sidebar", "user"],
    queryFn: fetchUserSummary,
    staleTime: 60_000,
  })

  const storeName = storeQuery.data?.name ?? "Tienda"
  const storeSubtitle = storeQuery.data?.subtitle

  return (
    <div
      data-skrepay-settings-sidebar
      className="bg-ui-bg-subtle flex h-full min-h-0 w-full flex-col"
    >
      <div className="border-ui-border-base border-b p-3">
        <Link
          to="/orders"
          replace
          className={clx(
            "text-ui-fg-subtle transition-fg mb-3 flex w-fit items-center gap-x-2 rounded-lg px-2 py-1.5 outline-none",
            "hover:bg-ui-bg-subtle-hover hover:text-ui-fg-base",
            "focus-visible:shadow-borders-focus"
          )}
        >
          <ArrowUturnLeft className="size-4" />
          <Text size="small" weight="plus" leading="compact">
            {t("app.nav.settings.header")}
          </Text>
        </Link>

        <div className="flex items-center gap-x-3 rounded-xl px-1 py-1">
          <div className="bg-ui-bg-base border-ui-border-base flex size-10 shrink-0 items-center justify-center rounded-xl border shadow-borders-base">
            <BuildingStorefront className="text-ui-fg-subtle size-5" />
          </div>
          <div className="min-w-0">
            <Text
              size="small"
              weight="plus"
              leading="compact"
              className="truncate"
            >
              {storeName}
            </Text>
            {storeSubtitle ? (
              <Text
                size="xsmall"
                leading="compact"
                className="text-ui-fg-muted truncate"
              >
                {storeSubtitle}
              </Text>
            ) : null}
          </div>
        </div>

        <div className="relative mt-3">
          <MagnifyingGlass className="text-ui-fg-muted pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
          <Input
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar"
            className="bg-ui-bg-base pl-8"
          />
        </div>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-y-0.5 overflow-y-auto px-2 py-3">
        {filteredItems.map((item) => {
          const Icon = getSettingsNavIcon(item.to)
          const active = isNavItemActive(pathname, item.to)

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={clx(
                "transition-fg flex items-center gap-x-2.5 rounded-lg px-2.5 py-2 outline-none",
                "hover:bg-ui-bg-subtle-hover",
                "focus-visible:shadow-borders-focus",
                active
                  ? "bg-ui-bg-base text-ui-fg-base shadow-elevation-card-rest"
                  : "text-ui-fg-subtle"
              )}
            >
              <Icon
                className={clx(
                  "size-[18px] shrink-0",
                  active ? "text-ui-fg-base" : "text-ui-fg-muted"
                )}
              />
              <Text
                size="small"
                weight="plus"
                leading="compact"
                className="truncate"
              >
                {item.label}
              </Text>
            </NavLink>
          )
        })}
      </nav>

      <div className="border-ui-border-base mt-auto border-t p-3">
        <div className="flex items-center gap-x-3 rounded-lg px-1 py-1">
          <Avatar
            size="small"
            variant="rounded"
            fallback={userQuery.data?.fallback ?? "?"}
          />
          <div className="min-w-0">
            <Text
              size="small"
              weight="plus"
              leading="compact"
              className="truncate"
            >
              {userQuery.data?.name ?? "…"}
            </Text>
            <Text
              size="xsmall"
              leading="compact"
              className="text-ui-fg-muted truncate"
            >
              {userQuery.data?.email ?? ""}
            </Text>
          </div>
        </div>
      </div>
    </div>
  )
}
