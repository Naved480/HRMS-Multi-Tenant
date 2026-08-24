import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';
import { tenantStorage, TenantContext } from '../context/tenant-context.service';
import { TenantRequestContextService } from '../context/tenant-request-context.service';
import { TenantException, TenantErrorCode } from '@app/common';

export interface TenantRequest extends Request {
  tenantId?: string;
  requestId?: string;
  user?: any;
}

@Injectable()
export class TenantResolverMiddleware implements NestMiddleware {
  constructor(private readonly tenantRequestContext: TenantRequestContextService) {}

  use(req: TenantRequest, res: Response, next: NextFunction): void {
    // 1. Request ID Correlation (Phase L)
    const rawReqId = req.headers['x-request-id'];
    const requestId =
      (Array.isArray(rawReqId) ? rawReqId[0] : rawReqId) || crypto.randomUUID();
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);

    // 2. Tenant Resolution Priority (Phase F)
    // Priority 1: JWT tenantId (Primary source of truth for authenticated requests)
    let tenantId: string | undefined = req.user?.tenantId;

    const rawHeader = req.headers['x-tenant-id'];
    const headerTenantId = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

    // Security Check: If user has JWT tenantId, prevent accessing a different tenant via header
    if (req.user?.tenantId && headerTenantId && headerTenantId !== req.user.tenantId) {
      throw new TenantException(
        TenantErrorCode.TENANT_ACCESS_DENIED,
        'Access denied: JWT tenant context does not match requested tenant header.',
      );
    }

    // Priority 2: Explicit x-tenant-id header (for unauthenticated / system onboarding calls)
    if (!tenantId && headerTenantId) {
      tenantId = headerTenantId;
    }

    // Priority 3: Subdomain extraction fallback (e.g. acme.hrms.local)
    if (!tenantId && req.headers.host) {
      const host = req.headers.host;
      const parts = host.split('.');
      if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'api') {
        tenantId = parts[0];
      }
    }

    const userId = req.user?.id || req.user?.sub;
    const roles = req.user?.roles || (req.user?.role ? [req.user.role] : []);

    const contextPayload: TenantContext = {
      tenantId,
      requestId,
      userId,
      roles,
    };

    if (tenantId) {
      req.tenantId = tenantId;
      this.tenantRequestContext.setTenantId(tenantId);

      const databaseName = `hrms_${tenantId.replace(/-/g, '_')}`;
      this.tenantRequestContext.setConnectionOptions({
        tenantId,
        databaseName,
        host: process.env.TENANT_DB_HOST || 'localhost',
        port: parseInt(process.env.TENANT_DB_PORT || '5432'),
        username: process.env.TENANT_DB_USER || 'postgres',
        password: process.env.TENANT_DB_PASSWORD || 'password',
        dialect: 'postgres',
      });
    }

    // Wrap execution inside AsyncLocalStorage.run() boundary (Phase E)
    tenantStorage.run(contextPayload, () => {
      next();
    });
  }
}
