import { AsyncLocalStorage } from "node:async_hooks"

export const tenantSchemaStorage = new AsyncLocalStorage<string>()

export function getActiveTenantSchema(): string | undefined {
  return tenantSchemaStorage.getStore()
}

/** Persiste el schema tenant en toda la cadena async del request HTTP. */
export function enterTenantSchema(schema: string): void {
  tenantSchemaStorage.enterWith(schema)
}

export function runWithTenantSchema<T>(
  schema: string,
  fn: () => T
): T {
  return tenantSchemaStorage.run(schema, fn)
}
