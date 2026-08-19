import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  tenantId: string;
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>();

@Injectable()
export class TenantContextService {
  getTenantId(): string | undefined {
    const store = tenantStorage.getStore();
    return store?.tenantId;
  }

  setTenantId(tenantId: string): void {
    tenantStorage.enterWith({ tenantId });
  }
}
