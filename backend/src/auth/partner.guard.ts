import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Guard to prevent cross-tenant resource access.
 * Validates that the resource belongs to the authenticated tenant.
 */
@Injectable()
export class PartnerGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenantId =
      request.tenantId || request.user?.partnerId || request.partner?.id;

    if (!tenantId) {
      return true; // Let other guards handle authentication
    }

    // Check route params for resource IDs that might belong to other tenants
    const params = request.params;

    // Common patterns: /companies/:id, /nfe/:accessKey, etc.
    if (params.id) {
      // Special case: if it's a UUID, check ownership
      const resource = await this.findResourceOwner(params.id);
      if (resource && resource.partnerId && resource.partnerId !== tenantId) {
        throw new ForbiddenException('Cross-tenant access denied');
      }
    }

    return true;
  }

  private async findResourceOwner(
    id: string,
  ): Promise<{ partnerId?: string | null } | null> {
    // Try to find in common tables
    try {
      // Check Issuer (company)
      const issuer = await this.prisma.issuer.findUnique({
        where: { id },
        select: { partnerId: true },
      });
      if (issuer) return { partnerId: issuer.partnerId ?? undefined };

      // Check Invoice
      const invoice = await this.prisma.invoice.findFirst({
        where: { id },
        include: { issuer: { select: { partnerId: true } } },
      });
      if (invoice) return { partnerId: invoice.issuer.partnerId ?? undefined };

      return null;
    } catch {
      return null;
    }
  }
}
