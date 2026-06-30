import { Heading, IconButton, Text } from "@medusajs/ui"
import type { ReactNode } from "react"
import {
  BuildingStorefront,
  ChevronRightMini,
  EllipsisHorizontal,
  MapPin,
} from "@medusajs/icons"
import { useQuery } from "@tanstack/react-query"
import { StoreDefaultCurrencySelect } from "./StoreDefaultCurrencySelect"
import {
  STORE_EDIT_PATH,
  REGIONS_PATH,
  countryFlagEmoji,
  fetchStoreSettingsSnapshot,
  formatPostalAddress,
  resolveCountryCode,
} from "../../lib/store-settings-api"

function SettingsCard({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-ui-border-base bg-ui-bg-base shadow-borders-base">
      {children}
    </div>
  )
}

function SettingsRow({
  href,
  children,
  trailing,
  withDivider = false,
}: {
  href?: string
  children: ReactNode
  trailing?: ReactNode
  withDivider?: boolean
}) {
  const className = [
    "flex items-center gap-x-4 px-5 py-4 transition-fg",
    withDivider ? "border-t border-ui-border-base" : "",
    href ? "hover:bg-ui-bg-base-hover cursor-pointer" : "",
  ]
    .filter(Boolean)
    .join(" ")

  const content = (
  <>
      {children}
      <div className="ml-auto flex shrink-0 items-center gap-x-2">
        {trailing}
        {href ? (
          <ChevronRightMini className="text-ui-fg-muted" />
        ) : null}
      </div>
    </>
  )

  if (href) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    )
  }

  return <div className={className}>{content}</div>
}

function SectionBlock({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-y-3">
      <div>
        <Heading level="h2" className="txt-compact-large-plus">
          {title}
        </Heading>
        {description ? (
          <Text size="small" className="text-ui-fg-subtle mt-1">
            {description}
          </Text>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function EditMenuButton() {
  return (
    <IconButton
      size="small"
      variant="transparent"
      className="rounded-full border border-ui-border-base"
      asChild
    >
      <a href={STORE_EDIT_PATH} aria-label="Editar tienda">
        <EllipsisHorizontal />
      </a>
    </IconButton>
  )
}

export function StoreSettingsShopifyPage() {
  const snapshotQuery = useQuery({
    queryKey: ["skrepay", "store-settings", "snapshot"],
    queryFn: fetchStoreSettingsSnapshot,
    retry: 1,
  })

  if (snapshotQuery.isPending) {
    return (
      <div data-skrepay-store-shell className="flex flex-col gap-y-8 px-6 py-6">
        <div className="flex items-center gap-x-2">
          <BuildingStorefront className="text-ui-fg-subtle" />
          <Heading level="h1">Tienda</Heading>
        </div>
        <Text size="small" className="text-ui-fg-subtle">
          Cargando configuración de la tienda…
        </Text>
      </div>
    )
  }

  if (snapshotQuery.isError || !snapshotQuery.data) {
    return (
      <div data-skrepay-store-shell className="flex flex-col gap-y-4 px-6 py-6">
        <div className="flex items-center gap-x-2">
          <BuildingStorefront className="text-ui-fg-subtle" />
          <Heading level="h1">Tienda</Heading>
        </div>
        <Text size="small" className="text-ui-fg-error">
          No se pudo cargar la configuración de la tienda.
        </Text>
      </div>
    )
  }

  const { store, userEmail, phone, location, region, defaultCurrencyCode } =
    snapshotQuery.data

  const address = formatPostalAddress(location, region)
  const countryCode = resolveCountryCode(location, region)
  const flag = countryFlagEmoji(countryCode)
  const businessName =
    (store.metadata?.business_name as string | undefined) ?? store.name
  const contactLine = [userEmail, phone].filter(Boolean).join(" · ")

  return (
    <div
      data-skrepay-store-shell
      className="flex flex-col gap-y-8 px-6 py-6"
    >
      <div className="flex items-center gap-x-2">
        <BuildingStorefront className="text-ui-fg-subtle" />
        <Heading level="h1">Tienda</Heading>
      </div>

      <SectionBlock
        title="Información comercial"
        description="Entidad comercial que se usa para productos financieros, mercados, apps e impuestos en esta tienda"
      >
        <SettingsCard>
          <SettingsRow trailing={<EditMenuButton />}>
            <div className="flex min-w-0 items-start gap-x-3">
              {flag ? (
                <span className="mt-0.5 text-xl leading-none" aria-hidden>
                  {flag}
                </span>
              ) : (
                <div className="mt-0.5 flex size-5 items-center justify-center rounded border border-ui-border-base bg-ui-bg-subtle text-[10px] font-medium uppercase text-ui-fg-muted">
                  {countryCode ?? "—"}
                </div>
              )}
              <div className="min-w-0">
                <Text size="small" weight="plus" className="text-ui-fg-base">
                  {businessName}
                </Text>
                {address ? (
                  <Text size="small" className="text-ui-fg-subtle mt-0.5">
                    {address}
                  </Text>
                ) : (
                  <Text size="small" className="text-ui-fg-muted mt-0.5">
                    Sin dirección comercial configurada
                  </Text>
                )}
              </div>
            </div>
          </SettingsRow>
        </SettingsCard>
      </SectionBlock>

      <SectionBlock title="Detalles de contacto de la tienda">
        <SettingsCard>
          <SettingsRow href={STORE_EDIT_PATH}>
            <BuildingStorefront className="text-ui-fg-muted shrink-0" />
            <div className="min-w-0">
              <Text size="small" weight="plus">
                {store.name}
              </Text>
              {contactLine ? (
                <Text size="small" className="text-ui-fg-subtle mt-0.5">
                  {contactLine}
                </Text>
              ) : (
                <Text size="small" className="text-ui-fg-muted mt-0.5">
                  Sin correo ni teléfono configurados
                </Text>
              )}
            </div>
          </SettingsRow>

          <SettingsRow href={STORE_EDIT_PATH} withDivider>
            <MapPin className="text-ui-fg-muted shrink-0" />
            <div className="min-w-0">
              <Text size="small" weight="plus">
                Dirección de la tienda
              </Text>
              {address ? (
                <Text size="small" className="text-ui-fg-subtle mt-0.5">
                  {address}
                </Text>
              ) : (
                <Text size="small" className="text-ui-fg-muted mt-0.5">
                  Configura una ubicación predeterminada para mostrar la dirección
                </Text>
              )}
            </div>
          </SettingsRow>
        </SettingsCard>
      </SectionBlock>

      <SectionBlock title="Valores predeterminados de la tienda">
        <SettingsCard>
          <SettingsRow
            trailing={
              <StoreDefaultCurrencySelect
                storeId={store.id}
                value={defaultCurrencyCode}
                currencies={store.supported_currencies ?? []}
              />
            }
          >
            <div className="min-w-0 flex-1">
              <Text size="small" weight="plus">
                Visualización de la moneda
              </Text>
              <Text size="small" className="text-ui-fg-subtle mt-0.5">
                Para gestionar las monedas que ven los clientes, ve a{" "}
                <a
                  href={REGIONS_PATH}
                  className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                >
                  Regiones
                </a>
                .
              </Text>
            </div>
          </SettingsRow>
        </SettingsCard>
      </SectionBlock>
    </div>
  )
}
