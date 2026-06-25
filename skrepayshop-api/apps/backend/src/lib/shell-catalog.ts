import type { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  deleteProductCategoriesWorkflow,
  deleteProductsWorkflow,
} from "@medusajs/medusa/core-flows"

export const SHELL_PRODUCT_COUNT = 12

export function getShellPlaceholderImageUrl() {
  const base =
    process.env.STOREFRONT_URL ||
    process.env.STOREFRONT_PREVIEW_URL ||
    "https://luigigame.com"

  return `${base.replace(/\/$/, "")}/placeholder-product.svg`
}

export function buildShellProductInputs(options: {
  categoryId: string
  shippingProfileId: string
  salesChannelId: string
}) {
  const imageUrl = getShellPlaceholderImageUrl()

  return Array.from({ length: SHELL_PRODUCT_COUNT }, (_, index) => {
    const number = index + 1

    return {
      title: `Producto ${number}`,
      handle: `producto-${number}`,
      description:
        "Producto de ejemplo. Reemplázalo con tu catálogo real desde el panel.",
      status: ProductStatus.PUBLISHED,
      category_ids: [options.categoryId],
      shipping_profile_id: options.shippingProfileId,
      metadata: {
        product_type: "key",
        platform: "Demo",
        region: "Global",
        is_shell: "true",
      },
      images: [{ url: imageUrl }],
      options: [
        {
          title: "Default",
          values: ["Standard"],
        },
      ],
      variants: [
        {
          title: "Standard",
          sku: `SHELL-PRODUCT-${number}`,
          options: {
            Default: "Standard",
          },
          prices: [
            {
              amount: 2499,
              currency_code: "eur",
            },
            {
              amount: 2699,
              currency_code: "usd",
            },
          ],
        },
      ],
      sales_channels: [{ id: options.salesChannelId }],
    }
  })
}

type SeedShellCatalogInput = {
  container: MedusaContainer
  shippingProfileId: string
  salesChannelId: string
  stockLocationId: string
}

export async function seedShellCatalog({
  container,
  shippingProfileId,
  salesChannelId,
  stockLocationId,
}: SeedShellCatalogInput) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  logger.info("Seeding shell catalog (placeholder products)...")

  const { result: categories } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        {
          name: "Catálogo de ejemplo",
          handle: "catalogo-ejemplo",
          is_active: true,
        },
      ],
    },
  })

  const category = categories[0]

  await createProductsWorkflow(container).run({
    input: {
      products: buildShellProductInputs({
        categoryId: category.id,
        shippingProfileId,
        salesChannelId,
      }),
    },
  })

  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  })

  if (inventoryItems.length) {
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: inventoryItems.map((item: { id: string }) => ({
          location_id: stockLocationId,
          stocked_quantity: 999,
          inventory_item_id: item.id,
        })),
      },
    })
  }

  logger.info(`Shell catalog ready with ${SHELL_PRODUCT_COUNT} placeholder products.`)
}

export async function resetShellCatalog(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  logger.info("Removing existing products and categories...")

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id"],
  })

  if (products.length) {
    await deleteProductsWorkflow(container).run({
      input: { ids: products.map((product: { id: string }) => product.id) },
    })
  }

  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id"],
  })

  if (categories.length) {
    await deleteProductCategoriesWorkflow(container).run({
      input: categories.map((category: { id: string }) => category.id),
    })
  }

  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
    pagination: { take: 1 },
  })

  const { data: salesChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id"],
    pagination: { take: 1 },
  })

  const { data: stockLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id"],
    pagination: { take: 1 },
  })

  const shippingProfileId = shippingProfiles[0]?.id
  const salesChannelId = salesChannels[0]?.id
  const stockLocationId = stockLocations[0]?.id

  if (!shippingProfileId || !salesChannelId || !stockLocationId) {
    throw new Error(
      "Store infrastructure missing. Run migrations/seed before shell reset."
    )
  }

  await seedShellCatalog({
    container,
    shippingProfileId,
    salesChannelId,
    stockLocationId,
  })

  logger.info("Shell catalog reset complete.")
}
