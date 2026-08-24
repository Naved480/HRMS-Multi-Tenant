import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  IS_PUBLIC_KEY,
  IS_PLATFORM_ROUTE_KEY,
  IS_TENANT_OPTIONAL_KEY,
  TenantException,
  TenantErrorCode,
} from '@app/common';
import { tenantStorage } from '../context/tenant-context.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Check bypass metadata decorators
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const isPlatformRoute = this.reflector.getAllAndOverride<boolean>(
      IS_PLATFORM_ROUTE_KEY,
      [context.getHandler(), context.getClass()],
    );

    const isTenantOptional = this.reflector.getAllAndOverride<boolean>(
      IS_TENANT_OPTIONAL_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Platform routes (e.g. SuperAdmin, health checks) or public routes bypass mandatory tenant validation
    if (isPublic || isPlatformRoute || isTenantOptional) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // Priority: JWT tenantId first, then header/request property
    const tenantId = request.user?.tenantId || request.tenantId || request.headers['x-tenant-id'];

    if (!tenantId) {
      throw new TenantException(
        TenantErrorCode.TENANT_REQUIRED,
        'Tenant context is required for this operation. Please provide a valid tenant context or x-tenant-id header.',
      );
    }

    // Tenant Status Validation
    const tenantStatus = request.user?.tenantStatus || request.tenantStatus || 'ACTIVE';
    if (tenantStatus === 'SUSPENDED') {
      throw new TenantException(
        TenantErrorCode.TENANT_SUSPENDED,
        'Organization account is suspended. Please contact support.',
      );
    }

    if (tenantStatus === 'EXPIRED') {
      throw new TenantException(
        TenantErrorCode.TENANT_EXPIRED,
        'Organization subscription has expired. Please renew your subscription.',
      );
    }

    request.tenantId = tenantId;
    tenantStorage.enterWith({
      tenantId,
      userId: request.user?.id || request.user?.sub,
      requestId: request.requestId,
      roles: request.user?.roles || (request.user?.role ? [request.user.role] : []),
    });

    return true;
  }
}
