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

    // Admins and superadmins bypass fine-grained permission checks
    if (userRoles.includes('admin') || userRoles.includes('superadmin')) {
      return true;
    }

    const userPermissions: string[] = Array.isArray(user.permissions)
      ? user.permissions
      : [];

    const hasAllPermissions = requiredPermissions.every((perm) =>
      userPermissions.includes(perm),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        `User missing required permissions: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
