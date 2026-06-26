import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Swatch } from "@medusajs/icons"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Select,
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
  main_banner_image_url: string
  main_banner_product_handle: string
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

type ProductOption = {
  id: string
  title: string
  handle: string
}

const emptyTheme: ThemeForm = {
  store_name: "",
  accent_color: "#10B981",
  hero_title: "",
  hero_subtitle: "",
  hero_badge: "",
  hero_cta_label: "",
  hero_cta_url: "/search",
  main_banner_image_url: "",
  main_banner_product_handle: "",
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
  storefront_preview_url: "",
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
  const [products, setProducts] = useState<ProductOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [primaryUrl, setPrimaryUrl] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const previewUrl = useMemo(() => {
    const base =
      primaryUrl ||
      theme.storefront_preview_url ||
      (typeof window !== "undefined"
        ? `https://${window.location.hostname}`
        : "https://skrepay.com")
    const url = new URL(base)
    url.searchParams.set("themePreview", Date.now().toString())
    return url.toString()
  }, [primaryUrl, theme.storefront_preview_url, saving])

  useEffect(() => {
    const load = async () => {
      try {
        const [themeResponse, productsResponse] = await Promise.all([
          fetch("/admin/storefront-theme", { credentials: "include" }),
          fetch("/admin/products?limit=100&fields=id,title,handle", {
            credentials: "include",
          }),
        ])

        if (!themeResponse.ok) {
          throw new Error("No se pudo cargar el tema")
        }

        const themeData = await themeResponse.json()
        setTheme({ ...emptyTheme, ...themeData.theme })
        setPrimaryUrl(themeData.primary_url ?? themeData.theme?.storefront_preview_url ?? "")

        if (productsResponse.ok) {
          const productsData = await productsResponse.json()
          setProducts(productsData.products ?? [])
        }
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

  const uploadBannerImage = async (file: File) => {
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/admin/storefront-theme/banner-image", {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const message =
          errorData?.message ||
          errorData?.type ||
          "No se pudo subir la imagen"
        throw new Error(message)
      }

      const data = await response.json()
      updateField("main_banner_image_url", data.url)
      toast.success("Imagen del banner cargada.")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al subir la imagen"
      )
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
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
            <Field label="Dominio público de la tienda">
              <div className="rounded-md border border-ui-border-base bg-ui-bg-subtle px-3 py-2">
                <Text size="small">
                  {primaryUrl || "Sin dominio principal configurado"}
                </Text>
              </div>
              <Button asChild variant="secondary" className="mt-2 w-fit" size="small">
                <Link to="/settings/domains">Configurar en Dominios</Link>
              </Button>
            </Field>
          </SectionBlock>

          <SectionBlock
            title="Banner principal"
            description="Imagen completa del banner superior. Al hacer clic, lleva al producto elegido."
          >
            {theme.main_banner_image_url ? (
              <div className="overflow-hidden rounded-lg border border-ui-border-base bg-ui-bg-subtle">
                <img
                  src={theme.main_banner_image_url}
                  alt="Vista previa del banner"
                  className="h-auto max-h-40 w-full object-cover"
                />
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-ui-border-base bg-ui-bg-subtle p-6 text-center">
                <Text size="small" className="text-ui-fg-subtle">
                  Aún no hay imagen de banner.
                </Text>
              </div>
            )}

            <Field label="Imagen del banner">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) {
                    void uploadBannerImage(file)
                  }
                }}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  isLoading={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Subir imagen
                </Button>
                {theme.main_banner_image_url ? (
                  <Button
                    type="button"
                    variant="transparent"
                    onClick={() => updateField("main_banner_image_url", "")}
                  >
                    Quitar imagen
                  </Button>
                ) : null}
              </div>
              <Text size="xsmall" className="text-ui-fg-subtle mt-2">
                Recomendado: banner horizontal ancho (ej. 1920×180 px). Máx. 5 MB.
              </Text>
            </Field>

            <Field label="URL de imagen (opcional)">
              <Input
                value={theme.main_banner_image_url}
                onChange={(e) =>
                  updateField("main_banner_image_url", e.target.value)
                }
                placeholder="https://..."
              />
            </Field>

            <Field label="Producto al que enlaza el banner">
              <Select
                value={theme.main_banner_product_handle || undefined}
                onValueChange={(value) =>
                  updateField("main_banner_product_handle", value)
                }
              >
                <Select.Trigger>
                  <Select.Value placeholder="Elige un producto" />
                </Select.Trigger>
                <Select.Content>
                  {products.map((product) => (
                    <Select.Item key={product.id} value={product.handle}>
                      {product.title}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
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
