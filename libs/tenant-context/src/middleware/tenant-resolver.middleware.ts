import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { tenantStorage } from '../context/tenant-context.service';
import { TenantRequestContextService } from '../context/tenant-request-context.service';

export interface TenantRequest extends Request {
  tenantId?: string;
}

@Injectable()
export class TenantResolverMiddleware implements NestMiddleware {
  constructor(private readonly tenantRequestContext: TenantRequestContextService) {}

  use(req: TenantRequest, res: Response, next: NextFunction): void {
    const rawHeader = req.headers['x-tenant-id'];
    let tenantId: string | undefined;

    if (Array.isArray(rawHeader)) {
      tenantId = rawHeader[0];
    } else if (typeof rawHeader === 'string') {
      tenantId = rawHeader;
    }

    // Fallback: subdomain extraction (e.g. acme.hrms.local)
    if (!tenantId && req.headers.host) {
      const host = req.headers.host;
      const parts = host.split('.');
      if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'api') {
        tenantId = parts[0];
      }
    }

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

      tenantStorage.enterWith({ tenantId });
    }

    next();
  }
}
