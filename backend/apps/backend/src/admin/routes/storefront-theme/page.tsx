import { useEffect, useMemo, useState, type ReactNode } from "react"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Swatch } from "@medusajs/icons"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Switch,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"

type ThemeForm = {
  store_name: string
  accent_color: string
  hero_title: string
  hero_subtitle: string
  hero_badge: string
  hero_cta_label: string
  hero_cta_url: string
  promo_title: string
  promo_cta_label: string
  promo_cta_url: string
  show_promo_banner: boolean
  show_bestsellers: boolean
  show_featured_deals: boolean
  show_hero_carousel: boolean
  show_category_pills: boolean
  show_product_list: boolean
  show_genre_grid: boolean
  storefront_preview_url: string
}

const emptyTheme: ThemeForm = {
  store_name: "",
  accent_color: "#10B981",
  hero_title: "",
  hero_subtitle: "",
  hero_badge: "",
  hero_cta_label: "",
  hero_cta_url: "/search",
  promo_title: "",
  promo_cta_label: "",
  promo_cta_url: "/search",
  show_promo_banner: true,
  show_bestsellers: true,
  show_featured_deals: true,
  show_hero_carousel: true,
  show_category_pills: true,
  show_product_list: true,
  show_genre_grid: true,
  storefront_preview_url: "https://strong-cascaron-2e0511.netlify.app",
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
    <div className="rounded-lg border border-ui-border-base bg-ui-bg-base p-4">
      <div className="mb-4">
        <Heading level="h2" className="txt-compact-medium-plus">
          {title}
        </Heading>
        {description ? (
          <Text size="small" className="text-ui-fg-subtle mt-1">
            {description}
          </Text>
        ) : null}
      </div>
      <div className="flex flex-col gap-y-4">{children}</div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

const StorefrontThemePage = () => {
  const [theme, setTheme] = useState<ThemeForm>(emptyTheme)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const previewUrl = useMemo(() => {
    const base = theme.storefront_preview_url || emptyTheme.storefront_preview_url
    const url = new URL(base)
    url.searchParams.set("themePreview", Date.now().toString())
    return url.toString()
  }, [theme.storefront_preview_url, saving])

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/admin/storefront-theme", {
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("No se pudo cargar el tema")
        }

        const data = await response.json()
        setTheme({ ...emptyTheme, ...data.theme })
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Error al cargar el tema"
        )
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const updateField = <K extends keyof ThemeForm>(key: K, value: ThemeForm[K]) => {
    setTheme((current) => ({ ...current, [key]: value }))
  }

  const save = async () => {
    setSaving(true)

    try {
      const response = await fetch("/admin/storefront-theme", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(theme),
      })

      if (!response.ok) {
        throw new Error("No se pudo guardar el tema")
      }

      const data = await response.json()
      setTheme({ ...emptyTheme, ...data.theme })
      toast.success("Tema guardado. La tienda se actualizará en segundos.")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al guardar el tema"
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Container className="p-6">
        <Text>Cargando editor de tema...</Text>
      </Container>
    )
  }

  return (
    <Container className="p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Heading level="h1">Tema de la tienda</Heading>
          <Text className="text-ui-fg-subtle mt-1">
            Edita la página de inicio que ven tus clientes. Búsqueda y ficha de
            producto no cambian aquí.
          </Text>
        </div>
        <Button onClick={save} isLoading={saving}>
          Guardar cambios
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
        <div className="flex flex-col gap-y-4">
          <SectionBlock
            title="Identidad"
            description="Nombre y color principal de la marca."
          >
            <Field label="Nombre de la tienda">
              <Input
                value={theme.store_name}
                onChange={(e) => updateField("store_name", e.target.value)}
              />
            </Field>
            <Field label="Color principal">
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={theme.accent_color}
                  onChange={(e) => updateField("accent_color", e.target.value)}
                  className="h-10 w-16 cursor-pointer p-1"
                />
                <Input
                  value={theme.accent_color}
                  onChange={(e) => updateField("accent_color", e.target.value)}
                />
              </div>
            </Field>
            <Field label="URL de vista previa">
              <Input
                value={theme.storefront_preview_url}
                onChange={(e) =>
                  updateField("storefront_preview_url", e.target.value)
                }
                placeholder="https://tu-tienda.netlify.app"
              />
            </Field>
          </SectionBlock>

          <SectionBlock
            title="Banner principal"
            description="Hero de la homepage."
          >
            <Field label="Título">
              <Input
                value={theme.hero_title}
                onChange={(e) => updateField("hero_title", e.target.value)}
              />
            </Field>
            <Field label="Subtítulo">
              <Input
                value={theme.hero_subtitle}
                onChange={(e) => updateField("hero_subtitle", e.target.value)}
              />
            </Field>
            <Field label="Etiqueta promocional">
              <Input
                value={theme.hero_badge}
                onChange={(e) => updateField("hero_badge", e.target.value)}
              />
            </Field>
            <Field label="Texto del botón">
              <Input
                value={theme.hero_cta_label}
                onChange={(e) => updateField("hero_cta_label", e.target.value)}
              />
            </Field>
            <Field label="Enlace del botón">
              <Input
                value={theme.hero_cta_url}
                onChange={(e) => updateField("hero_cta_url", e.target.value)}
              />
            </Field>
          </SectionBlock>

          <SectionBlock title="Banner promocional">
            <Field label="Título (usa Enter para salto de línea)">
              <Textarea
                value={theme.promo_title}
                onChange={(e) => updateField("promo_title", e.target.value)}
                rows={3}
              />
            </Field>
            <Field label="Texto del botón">
              <Input
                value={theme.promo_cta_label}
                onChange={(e) => updateField("promo_cta_label", e.target.value)}
              />
            </Field>
            <Field label="Enlace del botón">
              <Input
                value={theme.promo_cta_url}
                onChange={(e) => updateField("promo_cta_url", e.target.value)}
              />
            </Field>
          </SectionBlock>

          <SectionBlock
            title="Secciones visibles"
            description="Activa o oculta bloques de la homepage."
          >
            {[
              ["show_promo_banner", "Banner promocional"],
              ["show_bestsellers", "Más vendidos"],
              ["show_featured_deals", "Ofertas destacadas"],
              ["show_hero_carousel", "Carrusel"],
              ["show_category_pills", "Categorías"],
              ["show_product_list", "Lista de productos"],
              ["show_genre_grid", "Grid de géneros"],
            ].map(([key, label]) => (
              <div
                key={key}
                className="flex items-center justify-between gap-4"
              >
                <Text size="small">{label}</Text>
                <Switch
                  checked={theme[key as keyof ThemeForm] as boolean}
                  onCheckedChange={(checked) =>
                    updateField(key as keyof ThemeForm, checked)
                  }
                />
              </div>
            ))}
          </SectionBlock>
        </div>

        <div className="rounded-lg border border-ui-border-base bg-ui-bg-base p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <Heading level="h2" className="txt-compact-medium-plus">
              Vista previa
            </Heading>
            <Button
              size="small"
              variant="secondary"
              onClick={() => window.open(previewUrl, "_blank")}
            >
              Abrir en pestaña nueva
            </Button>
          </div>
          <div className="overflow-hidden rounded-lg border border-ui-border-base bg-ui-bg-subtle">
            <iframe
              key={previewUrl}
              title="Vista previa de la tienda"
              src={previewUrl}
              className="h-[720px] w-full bg-black"
            />
          </div>
        </div>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Tema de la tienda",
  icon: Swatch,
  rank: 5,
})

export default StorefrontThemePage
