import { getPlatformPool } from "./platform-db"

export type AbandonedCartRow = {
  id: string
  email: string | null
  customer_email: string | null
  currency_code: string
  item_count: number
  subtotal: number
  created_at: string
  updated_at: string
}

function quoteSchema(schema: string): string {
  return `"${schema.replace(/"/g, '""')}"`
}

export async function listAbandonedCarts(
  schema: string | null | undefined,
  options: { limit: number; offset: number }
): Promise<{ carts: AbandonedCartRow[]; count: number }> {
  if (!schema) {
    return { carts: [], count: 0 }
  }

  const schemaQ = quoteSchema(schema)
  const pool = getPlatformPool()

  const countResult = await pool.query<{ count: string }>(
    `select count(*)::int as count
     from (
       select c.id
       from ${schemaQ}.cart c
       inner join ${schemaQ}.cart_line_item cli
         on cli.cart_id = c.id and cli.deleted_at is null
       where c.completed_at is null
         and c.deleted_at is null
       group by c.id
       having count(cli.id) > 0
     ) abandoned`
  )

  const count = countResult.rows[0]?.count ?? 0

  const listResult = await pool.query<AbandonedCartRow>(
    `select
       c.id,
       c.email,
       coalesce(c.email, cust.email) as customer_email,
       coalesce(c.currency_code, 'eur') as currency_code,
       count(cli.id)::int as item_count,
       coalesce(sum(cli.unit_price * cli.quantity), 0)::float as subtotal,
       c.created_at,
       c.updated_at
     from ${schemaQ}.cart c
     inner join ${schemaQ}.cart_line_item cli
       on cli.cart_id = c.id and cli.deleted_at is null
     left join ${schemaQ}.customer cust on cust.id = c.customer_id
     where c.completed_at is null
       and c.deleted_at is null
     group by c.id, c.email, cust.email, c.currency_code, c.created_at, c.updated_at
     having count(cli.id) > 0
     order by c.updated_at desc
     limit $1 offset $2`,
    [options.limit, options.offset]
  )

  return {
    carts: listResult.rows,
    count: Number(count),
  }
}
