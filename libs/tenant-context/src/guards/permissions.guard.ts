import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if ((context.getType() as string) === 'rpc') {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User context not found on request');
    }

    const userRoles: string[] = Array.isArray(user.roles)
      ? user.roles
      : user.role
        ? [user.role]
        : [];

    const isSystemAdmin = userRoles.some((r) =>
      ['admin', 'superadmin', 'organization_admin'].includes(String(r).toLowerCase()),
    );

    // Admins and superadmins bypass fine-grained role permission checks
    if (isSystemAdmin) {
      return true;
    }

    const userPermissions: string[] = Array.isArray(user.permissions)
      ? user.permissions
      : [];

    // Allow access if user has at least one of the accepted required permissions or permission aliases
    const hasPermission = requiredPermissions.some((perm) => {
      if (userPermissions.includes(perm)) return true;
      // Check dot/colon equivalencies e.g. 'users:read' <-> 'user_management.view'
      if (perm === 'users:read' && (userPermissions.includes('user_management.view') || userPermissions.includes('user_management.manage'))) return true;
      if (perm === 'users:write' && (userPermissions.includes('user_management.create') || userPermissions.includes('user_management.edit') || userPermissions.includes('user_management.manage'))) return true;
      if (perm === 'roles:read' && (userPermissions.includes('user_management.view') || userPermissions.includes('user_management.manage'))) return true;
      return false;
    });

    if (!hasPermission) {
      throw new ForbiddenException(
        `User missing required permissions: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
