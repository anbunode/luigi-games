import { AsyncLocalStorage } from "node:async_hooks"

export const tenantSchemaStorage = new AsyncLocalStorage<string>()

/** Schema activo para la petición HTTP actual (fallback cuando ALS no propaga). */
let requestBoundTenantSchema: string | undefined

export function bindRequestTenantSchema(schema: string | undefined): void {
  requestBoundTenantSchema = schema
}

export function getActiveTenantSchema(): string | undefined {
  return tenantSchemaStorage.getStore() ?? requestBoundTenantSchema
}

export function runWithTenantSchema<T>(
  schema: string,
  fn: () => T
): T {
  return tenantSchemaStorage.run(schema, fn)
}
