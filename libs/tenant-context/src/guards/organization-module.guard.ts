import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
  Optional,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import {
  SERVICES,
  MESSAGE_PATTERNS,
  TenantException,
  TenantErrorCode,
  IS_PUBLIC_KEY,
  IS_PLATFORM_ROUTE_KEY,
} from '@app/common';
import { REQUIRE_MODULE_KEY, RequiredModuleMetadata } from '../decorators/require-module.decorator';

@Injectable()
export class OrganizationModuleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Optional() @Inject(SERVICES.TENANT_SERVICE) private readonly tenantClient?: ClientProxy,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const isPlatformRoute = this.reflector.getAllAndOverride<boolean>(
      IS_PLATFORM_ROUTE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic || isPlatformRoute) {
      return true;
    }

    const requiredModule = this.reflector.getAllAndOverride<RequiredModuleMetadata>(
      REQUIRE_MODULE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredModule) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenantId =
      request.tenantId ||
      request.user?.tenantId ||
      request.headers?.['x-tenant-id'];

    if (!tenantId) {
      throw new TenantException(
        TenantErrorCode.TENANT_REQUIRED,
        'Tenant context is required to verify module access.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check module entitlement via tenantClient microservice if present
    if (this.tenantClient) {
      try {
        const checkResult = await firstValueFrom(
          this.tenantClient
            .send(MESSAGE_PATTERNS.ORGANIZATION.CHECK_MODULE_ACCESS, {
              tenantId,
              moduleKey: requiredModule.moduleKey,
              action: requiredModule.action,
            })
            .pipe(timeout(5000)),
        );

        if (!checkResult || !checkResult.enabled || !checkResult.allowed) {
          throw new TenantException(
            TenantErrorCode.MODULE_NOT_ENABLED,
            checkResult?.reason ||
              `Module '${requiredModule.moduleKey}' is not enabled for this organization.`,
            HttpStatus.FORBIDDEN,
          );
        }
      } catch (err: any) {
        if (err instanceof TenantException) {
          throw err;
        }
        // If microservice call fails or throws, rethrow as forbidden module exception
        throw new TenantException(
          TenantErrorCode.MODULE_NOT_ENABLED,
          `Access denied to module '${requiredModule.moduleKey}' for this organization.`,
          HttpStatus.FORBIDDEN,
        );
      }
    }

    return true;
  }
}
