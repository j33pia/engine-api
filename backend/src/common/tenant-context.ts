import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  tenantId: string;
  userId?: string;
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>();

export function getTenantId(): string | undefined {
  return tenantStorage.getStore()?.tenantId;
}

export function getTenantContext(): TenantContext | undefined {
  return tenantStorage.getStore();
}

export function runWithTenant<T>(tenantId: string, fn: () => T): T {
  return tenantStorage.run({ tenantId }, fn);
}
