import { getPlatformLoginUrl } from "./platform-url"
import { installProductPricingBridge } from "./product-pricing-bridge"
import { installRegionFormUiBridge } from "./region-form-bridge"
import { installStoreEditUiBridge } from "./store-edit-bridge"
import { readLocalCurrencyTaxCheckbox } from "./store-edit-ui"
import { formatRegionFormCurrencyOptions } from "./region-form-ui"
import { isProductPricingPage, isRegionFormPage, isStoreEditPage, notifyRouteChange } from "./region-routes"
import { installSettingsSidebarBridge } from "./settings-sidebar-bridge"
import { installSettingsShopifySkin } from "./settings-shopify-skin"

declare global {
  interface Window {
    __skrepayAuthBridgeInstalled?: boolean
  }
}

function getLogoutUrl() {
  return `${window.location.origin}/skrepay/logout`
}

function isAdminStoresRequest(method: string, url: string): boolean {
  if (method !== "GET") {
    return false
  }

  try {
    const parsed = new URL(url, window.location.origin)
    return /^\/admin\/stores\/?$/.test(parsed.pathname)
  } catch {
    return url.includes("/admin/stores") && !url.includes("/admin/stores/")
  }
}

async function patchStoreListWithRegionCatalog(
  response: Response,
  originalFetch: typeof fetch
): Promise<Response> {
  if (!response.ok) {
    return response
  }

  const catalogResponse = await originalFetch(
    `/admin/skrepay/region-currencies?_ts=${Date.now()}`,
    {
      credentials: "include",
      cache: "no-store",
    }
  )

  if (!catalogResponse.ok) {
    return response
  }

  const [storeBody, catalogBody] = await Promise.all([
    response.json(),
    catalogResponse.json(),
  ])

  const catalog = catalogBody.supported_currencies
  if (!Array.isArray(catalog) || catalog.length === 0) {
    return new Response(JSON.stringify(storeBody), {
      status: response.status,
      headers: response.headers,
    })
  }

  const formattedCatalog = formatRegionFormCurrencyOptions(catalog)

  const patchStore = (store: Record<string, unknown>) => ({
    ...store,
    supported_currencies: formattedCatalog,
  })

  const patched =
    storeBody && typeof storeBody === "object"
      ? {
          ...(storeBody as Record<string, unknown>),
          ...(Array.isArray((storeBody as { stores?: unknown[] }).stores)
            ? {
                stores: (storeBody as { stores: Record<string, unknown>[] }).stores.map(
                  (store) => patchStore(store)
                ),
              }
            : {}),
          ...((storeBody as { store?: Record<string, unknown> }).store
            ? {
                store: patchStore(
                  (storeBody as { store: Record<string, unknown> }).store
                ),
              }
            : {}),
        }
      : storeBody

  return new Response(JSON.stringify(patched), {
    status: response.status,
    headers: response.headers,
  })
}

type StoreCurrencyRow = {
  currency_code: string
  is_default?: boolean
}

function isAdminStoreByIdPost(method: string, url: string): boolean {
  if (method !== "POST") {
    return false
  }

  try {
    const parsed = new URL(url, window.location.origin)
    return /^\/admin\/stores\/[^/]+\/?$/.test(parsed.pathname)
  } catch {
    return /\/admin\/stores\/[^/]+/.test(url) && !url.includes("/admin/stores?")
  }
}

function patchStoreUpdateWithLocalCurrencyTax(
  body: Record<string, unknown>
): Record<string, unknown> {
  const list = body.supported_currencies

  if (!Array.isArray(list)) {
    return body
  }

  const taxSwitch = document.getElementById("skrepay-local-currency-tax-switch")
  const onStoreEditPage = isStoreEditPage(window.location.pathname)

  if (!onStoreEditPage && !(taxSwitch instanceof HTMLButtonElement)) {
    return body
  }

  const enabled = readLocalCurrencyTaxCheckbox()

  const defaultEntry = list.find(
    (row) =>
      row &&
      typeof row === "object" &&
      (row as { is_default?: boolean }).is_default
  ) as { currency_code?: string } | undefined

  const defaultCode = defaultEntry?.currency_code?.toLowerCase()
  if (!defaultCode) {
    return body
  }

  return {
    ...body,
    supported_currencies: list.map((row) => {
      if (!row || typeof row !== "object") {
        return row
      }

      const entry = row as Record<string, unknown>
      const code = String(entry.currency_code ?? "").toLowerCase()

      return {
        ...entry,
        is_tax_inclusive: code === defaultCode ? enabled : false,
      }
    }),
  }
}

async function patchStoreUpdateRequest(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  originalFetch: typeof fetch
): Promise<Response> {
  const request =
    input instanceof Request ? input : new Request(input, init)

  const bodyText = await request.clone().text()
  if (!bodyText) {
    return originalFetch(input, init)
  }

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(bodyText) as Record<string, unknown>
  } catch {
    return originalFetch(input, init)
  }

  const patched = patchStoreUpdateWithLocalCurrencyTax(parsed)
  const headers = new Headers(request.headers)
  headers.set("Content-Type", "application/json")

  return originalFetch(request.url, {
    method: request.method,
    headers,
    body: JSON.stringify(patched),
    credentials: request.credentials,
    mode: request.mode,
    cache: request.cache,
    redirect: request.redirect,
    referrer: request.referrer,
    integrity: request.integrity,
  })
}

function reorderStoreCurrenciesDefaultFirst(
  store: Record<string, unknown>
): Record<string, unknown> {
  const list = store.supported_currencies

  if (!Array.isArray(list) || list.length < 2) {
    return store
  }

  const currencies = list as StoreCurrencyRow[]
  const reordered = [
    ...currencies.filter((row) => row.is_default),
    ...currencies.filter((row) => !row.is_default),
  ]

  return {
    ...store,
    supported_currencies: reordered,
  }
}

async function patchStoreListForProductPricing(
  response: Response
): Promise<Response> {
  if (!response.ok) {
    return response
  }

  const storeBody = await response.json()
  const patchStore = (store: Record<string, unknown>) =>
    reorderStoreCurrenciesDefaultFirst(store)

  const patched =
    storeBody && typeof storeBody === "object"
      ? {
          ...(storeBody as Record<string, unknown>),
          ...(Array.isArray((storeBody as { stores?: unknown[] }).stores)
            ? {
                stores: (storeBody as { stores: Record<string, unknown>[] }).stores.map(
                  (store) => patchStore(store)
                ),
              }
            : {}),
          ...((storeBody as { store?: Record<string, unknown> }).store
            ? {
                store: patchStore(
                  (storeBody as { store: Record<string, unknown> }).store
                ),
              }
            : {}),
        }
      : storeBody

  return new Response(JSON.stringify(patched), {
    status: response.status,
    headers: response.headers,
  })
}

export function installAuthBridge() {
  if (typeof window === "undefined" || window.__skrepayAuthBridgeInstalled) {
    return
  }

  window.__skrepayAuthBridgeInstalled = true

  const loginUrl = getPlatformLoginUrl()
  const logoutUrl = getLogoutUrl()
  const originalFetch = window.fetch.bind(window)

  window.fetch = async (input, init) => {
    const method = (
      init?.method ?? (input instanceof Request ? input.method : "GET")
    ).toUpperCase()
    const url =
      typeof input === "string"
        ? input
        : input instanceof Request
          ? input.url
          : String(input)

    if (method === "DELETE" && url.includes("/auth/session")) {
      window.location.replace(logoutUrl)
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (
      isStoreEditPage(window.location.pathname) &&
      isAdminStoreByIdPost(method, url)
    ) {
      return patchStoreUpdateRequest(input, init, originalFetch)
    }

    if (
      isRegionFormPage(window.location.pathname) &&
      isAdminStoresRequest(method, url)
    ) {
      const headers = new Headers(init?.headers)
      headers.set("x-skrepay-region-form", "1")
      const patchedInit = {
        ...init,
        headers,
      }
      const response = await originalFetch(input, patchedInit)
      return patchStoreListWithRegionCatalog(response, originalFetch)
    }

    if (
      isProductPricingPage(window.location.pathname) &&
      isAdminStoresRequest(method, url)
    ) {
      const response = await originalFetch(input, init)
      return patchStoreListForProductPricing(response)
    }

    const response = await originalFetch(input, init)

    if (
      method === "DELETE" &&
      url.includes("/auth/session") &&
      response.ok
    ) {
      window.location.replace(logoutUrl)
    }

    return response
  }

  const blockLoginNavigation = (target: string | URL | null | undefined) => {
    if (!target) {
      return false
    }

    return String(target).includes("/login")
  }

  const originalPushState = history.pushState.bind(history)
  history.pushState = ((...args: Parameters<History["pushState"]>) => {
    if (blockLoginNavigation(args[2])) {
      window.location.replace(loginUrl)
      return
    }
    const result = originalPushState(...args)
    notifyRouteChange()
    return result
  }) as History["pushState"]

  const originalReplaceState = history.replaceState.bind(history)
  history.replaceState = ((...args: Parameters<History["replaceState"]>) => {
    if (blockLoginNavigation(args[2])) {
      window.location.replace(loginUrl)
      return
    }
    const result = originalReplaceState(...args)
    notifyRouteChange()
    return result
  }) as History["replaceState"]

  installProductPricingBridge()
  installRegionFormUiBridge()
  installStoreEditUiBridge()
  installSettingsShopifySkin()
  installSettingsSidebarBridge()
}
