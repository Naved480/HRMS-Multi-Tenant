import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  tenantId?: string;
  tenantSlug?: string;
  tenantStatus?: string;
  requestId?: string;
  userId?: string;
  roles?: string[];
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>();

@Injectable()
export class TenantContextService {
  /**
   * Safely run callback within AsyncLocalStorage context boundary
   */
  run<T>(context: TenantContext, callback: () => T): T {
    return tenantStorage.run(context, callback);
  }

  /**
   * Set or update current context
   */
  setContext(context: Partial<TenantContext>): void {
    const current = tenantStorage.getStore() || {};
    const updated = { ...current, ...context };
    tenantStorage.enterWith(updated);
  }

  /**
   * Get full tenant context
   */
  getContext(): TenantContext | undefined {
    return tenantStorage.getStore();
  }

  /**
   * Get tenant ID
   */
  getTenantId(): string | undefined {
    const store = tenantStorage.getStore();
    return store?.tenantId;
  }

  /**
   * Get user ID
   */
  getUserId(): string | undefined {
    const store = tenantStorage.getStore();
    return store?.userId;
  }

  /**
   * Get request ID
   */
  getRequestId(): string | undefined {
    const store = tenantStorage.getStore();
    return store?.requestId;
  }

  /**
   * Clear current context
   */
  clearContext(): void {
    tenantStorage.enterWith({});
  }
}
