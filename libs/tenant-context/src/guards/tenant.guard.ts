import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { tenantStorage } from '../context/tenant-context.service';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.headers['x-tenant-id'] || request.user?.tenantId;

    if (!tenantId) {
      throw new UnauthorizedException('Tenant header (x-tenant-id) or context is missing.');
    }

    request.tenantId = tenantId;
    tenantStorage.enterWith({ tenantId });
    return true;
  }
}
