import { Client } from "pg"
import { generateEntityId } from "@medusajs/framework/utils"

function sslForUrl(connectionString: string) {
  return connectionString.includes("localhost")
    ? undefined
    : { rejectUnauthorized: false }
}

function quoteIdent(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

export async function seedTenantCommerceData(
  connectionString: string,
  schema: string,
  shopName: string,
  salesChannelId: string
): Promise<{ store_id: string; region_id: string }> {
  const schemaQ = quoteIdent(schema)
  const client = new Client({
    connectionString: connectionString.split("?")[0],
    ssl: sslForUrl(connectionString),
  })

  await client.connect()

  try {
    const existing = await client.query<{ id: string }>(
      `select id from ${schemaQ}.store where deleted_at is null limit 1`
    )

    if (existing.rows[0]?.id) {
      const region = await client.query<{ id: string }>(
        `select id from ${schemaQ}.region where deleted_at is null limit 1`
      )
      return {
        store_id: existing.rows[0].id,
        region_id: region.rows[0]?.id ?? "",
      }
    }

    const storeId = generateEntityId(undefined, "store")
    const regionId = generateEntityId(undefined, "reg")

    await client.query("begin")

    await client.query(
      `insert into ${schemaQ}.region (
         id, name, currency_code, automatic_taxes, created_at, updated_at
       ) values ($1, 'Europe', 'eur', false, now(), now())`,
      [regionId]
    )

    await client.query(
      `insert into ${schemaQ}.store (
         id, name, default_sales_channel_id, default_region_id, created_at, updated_at
       ) values ($1, $2, $3, $4, now(), now())`,
      [storeId, shopName, salesChannelId, regionId]
    )

    for (const [currencyCode, isDefault] of [
      ["eur", true],
      ["usd", false],
    ] as const) {
      await client.query(
        `insert into ${schemaQ}.store_currency (id, currency_code, store_id, is_default, created_at, updated_at)
         values ($1, $2, $3, $4, now(), now())
         on conflict do nothing`,
        [generateEntityId(undefined, "stocur"), currencyCode, storeId, isDefault]
      )
    }

    await client.query(
      `insert into ${schemaQ}.region_country (iso_2, iso_3, num_code, name, display_name, region_id, created_at, updated_at)
       values ('es', 'esp', 724, 'Spain', 'Spain', $1, now(), now())
       on conflict do nothing`,
      [regionId]
    )

    await client.query("commit")

    return { store_id: storeId, region_id: regionId }
  } catch (error) {
    await client.query("rollback")
    throw error
  } finally {
    await client.end()
  }
}
