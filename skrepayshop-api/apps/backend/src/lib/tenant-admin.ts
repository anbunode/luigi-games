import scryptKdf from "scrypt-kdf"
import { Client } from "pg"
import { generateEntityId } from "@medusajs/framework/utils"

const HASH_CONFIG = { logN: 15, r: 8, p: 1 }

export type TenantAdminInput = {
  email: string
  password: string
  shopName: string
  slug: string
}

export type TenantAdminResult = {
  medusa_user_id: string
  medusa_sales_channel_id: string
  auth_identity_id: string
}

function sslForUrl(connectionString: string) {
  return connectionString.includes("localhost")
    ? undefined
    : { rejectUnauthorized: false }
}

function quoteIdent(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

export async function hashTenantPassword(password: string): Promise<string> {
  const buf = await scryptKdf.kdf(password, HASH_CONFIG)
  return buf.toString("base64")
}

export async function verifyTenantPassword(
  password: string,
  hashB64: string
): Promise<boolean> {
  return scryptKdf.verify(Buffer.from(hashB64, "base64"), password)
}

export async function bootstrapTenantAdminInSchema(
  connectionString: string,
  schema: string,
  input: TenantAdminInput
): Promise<TenantAdminResult> {
  const email = input.email.trim().toLowerCase()
  const userId = generateEntityId(undefined, "user")
  const authIdentityId = generateEntityId(undefined, "authid")
  const providerIdentityId = generateEntityId(undefined, "provid")
  const salesChannelId = generateEntityId(undefined, "sc")
  const passwordHash = await hashTenantPassword(input.password)
  const schemaQ = quoteIdent(schema)

  const client = new Client({
    connectionString: connectionString.split("?")[0],
    ssl: sslForUrl(connectionString),
  })

  await client.connect()

  try {
    await client.query("begin")

    const existing = await client.query<{ id: string }>(
      `select pi.id
       from ${schemaQ}.provider_identity pi
       where lower(pi.entity_id) = lower($1) and pi.deleted_at is null
       limit 1`,
      [email]
    )

    if (existing.rows[0]) {
      throw new Error("Ya existe una cuenta con este correo en esta tienda.")
    }

    await client.query(
      `insert into ${schemaQ}."user" (id, email, first_name, last_name, created_at, updated_at)
       values ($1, $2, $3, '', now(), now())`,
      [userId, email, input.shopName.trim()]
    )

    await client.query(
      `insert into ${schemaQ}.auth_identity (id, app_metadata, created_at, updated_at)
       values ($1, $2::jsonb, now(), now())`,
      [authIdentityId, JSON.stringify({ user_id: userId })]
    )

    await client.query(
      `insert into ${schemaQ}.provider_identity (
         id, entity_id, provider, auth_identity_id, provider_metadata, created_at, updated_at
       ) values ($1, $2, 'emailpass', $3, $4::jsonb, now(), now())`,
      [
        providerIdentityId,
        email,
        authIdentityId,
        JSON.stringify({ password: passwordHash }),
      ]
    )

    await client.query(
      `insert into ${schemaQ}.sales_channel (
         id, name, description, is_disabled, created_at, updated_at
       ) values ($1, $2, $3, false, now(), now())`,
      [salesChannelId, input.shopName.trim(), `Canal SkrepayShop — ${input.slug}`]
    )

    await client.query("commit")

    return {
      medusa_user_id: userId,
      medusa_sales_channel_id: salesChannelId,
      auth_identity_id: authIdentityId,
    }
  } catch (error) {
    await client.query("rollback")
    throw error
  } finally {
    await client.end()
  }
}

export async function authenticateTenantInSchema(
  connectionString: string,
  schema: string,
  email: string,
  password: string
): Promise<{ userId: string; authIdentityId: string }> {
  const schemaQ = quoteIdent(schema)
  const client = new Client({
    connectionString: connectionString.split("?")[0],
    ssl: sslForUrl(connectionString),
  })

  await client.connect()

  try {
    const row = await client.query<{
      user_id: string
      auth_identity_id: string
      password_hash: string
    }>(
      `select
         ai.app_metadata->>'user_id' as user_id,
         ai.id as auth_identity_id,
         pi.provider_metadata->>'password' as password_hash
       from ${schemaQ}.provider_identity pi
       join ${schemaQ}.auth_identity ai on ai.id = pi.auth_identity_id
       where lower(pi.entity_id) = lower($1)
         and pi.provider = 'emailpass'
         and pi.deleted_at is null
         and ai.deleted_at is null
       limit 1`,
      [email.trim().toLowerCase()]
    )

    const record = row.rows[0]

    if (!record?.user_id || !record.password_hash) {
      throw new Error("Credenciales incorrectas.")
    }

    const valid = await verifyTenantPassword(password, record.password_hash)

    if (!valid) {
      throw new Error("Credenciales incorrectas.")
    }

    return {
      userId: record.user_id,
      authIdentityId: record.auth_identity_id,
    }
  } finally {
    await client.end()
  }
}

export async function copyTenantAdminFromPublic(
  connectionString: string,
  schema: string,
  email: string,
  shopName: string,
  slug: string
): Promise<TenantAdminResult> {
  const schemaQ = quoteIdent(schema)
  const normalizedEmail = email.trim().toLowerCase()

  const client = new Client({
    connectionString: connectionString.split("?")[0],
    ssl: sslForUrl(connectionString),
  })

  await client.connect()

  try {
    const source = await client.query<{
      user_id: string
      provider_identity_id: string
      password_hash: string
    }>(
      `select
         u.id as user_id,
         pi.id as provider_identity_id,
         pi.provider_metadata->>'password' as password_hash
       from public."user" u
       join public.auth_identity ai on (ai.app_metadata->>'user_id') = u.id
       join public.provider_identity pi on pi.auth_identity_id = ai.id
       where lower(u.email) = lower($1)
         and u.deleted_at is null
         and pi.provider = 'emailpass'
       limit 1`,
      [normalizedEmail]
    )

    if (!source.rows[0]?.password_hash) {
      throw new Error(`No hay admin en public con email ${normalizedEmail}`)
    }

    const userId = generateEntityId(undefined, "user")
    const authIdentityId = generateEntityId(undefined, "authid")
    const providerIdentityId = generateEntityId(undefined, "provid")
    let salesChannelId = generateEntityId(undefined, "sc")

    await client.query("begin")

    await client.query(
      `insert into ${schemaQ}."user" (id, email, first_name, last_name, created_at, updated_at)
       select $1, email, first_name, last_name, now(), now()
       from public."user" where id = $2`,
      [userId, source.rows[0].user_id]
    )

    await client.query(
      `insert into ${schemaQ}.auth_identity (id, app_metadata, created_at, updated_at)
       values ($1, $2::jsonb, now(), now())`,
      [authIdentityId, JSON.stringify({ user_id: userId })]
    )

    await client.query(
      `insert into ${schemaQ}.provider_identity (
         id, entity_id, provider, auth_identity_id, provider_metadata, created_at, updated_at
       ) values ($1, $2, 'emailpass', $3, $4::jsonb, now(), now())`,
      [
        providerIdentityId,
        normalizedEmail,
        authIdentityId,
        JSON.stringify({ password: source.rows[0].password_hash }),
      ]
    )

    const channel = await client.query<{ id: string }>(
      `select id from ${schemaQ}.sales_channel where deleted_at is null order by created_at asc limit 1`
    )

    if (channel.rows[0]?.id) {
      salesChannelId = channel.rows[0].id
    } else {
      await client.query(
        `insert into ${schemaQ}.sales_channel (
           id, name, description, is_disabled, created_at, updated_at
         ) values ($1, $2, $3, false, now(), now())`,
        [salesChannelId, shopName, `Canal SkrepayShop — ${slug}`]
      )
    }

    await client.query("commit")

    return {
      medusa_user_id: userId,
      medusa_sales_channel_id: salesChannelId,
      auth_identity_id: authIdentityId,
    }
  } catch (error) {
    await client.query("rollback")
    throw error
  } finally {
    await client.end()
  }
}
