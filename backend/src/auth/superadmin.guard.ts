import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * Guard to restrict access to SuperAdmin-only routes.
 * Only users with role 'SUPERADMIN' can access /admin/* endpoints.
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (user.role !== 'SUPERADMIN') {
      throw new ForbiddenException('SuperAdmin access required');
    }

    return true;
  }
}
