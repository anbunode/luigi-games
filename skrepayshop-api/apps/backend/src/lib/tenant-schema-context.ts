import { AsyncLocalStorage } from "node:async_hooks"

export const tenantSchemaStorage = new AsyncLocalStorage<string>()

/** Schema activo para la petición HTTP actual (fallback cuando ALS no propaga). */
let requestBoundTenantSchema: string | undefined
let requestBoundSearchPathSchemas: string[] | undefined

export function bindRequestTenantSchema(schema: string | undefined): void {
  requestBoundTenantSchema = schema
}

export function bindRequestSearchPathSchemas(
  schemas: string[] | undefined
): void {
  requestBoundSearchPathSchemas = schemas
}

export function getActiveTenantSchema(): string | undefined {
  return tenantSchemaStorage.getStore() ?? requestBoundTenantSchema
}

export function getActiveSearchPathSchemas(): string[] | undefined {
  if (requestBoundSearchPathSchemas?.length) {
    return requestBoundSearchPathSchemas
  }

  const tenantSchema = getActiveTenantSchema()
  return tenantSchema ? [tenantSchema] : undefined
}

export function runWithTenantSchema<T>(
  schema: string,
  fn: () => T
): T {
  return tenantSchemaStorage.run(schema, fn)
}
