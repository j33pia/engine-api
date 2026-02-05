import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract the current tenant ID from the request
 *
 * @example
 * @Get()
 * findAll(@CurrentTenant() tenantId: string) {
 *   return this.service.findAll(tenantId);
 * }
 */
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantId || request.user?.partnerId || request.partner?.id;
  },
);

/**
 * Decorator to extract the current user from the request
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
