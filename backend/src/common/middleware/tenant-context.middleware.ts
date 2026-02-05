import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { tenantStorage } from '../tenant-context';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Extract tenant ID from JWT user or API Key partner
    const tenantId = (req as any).user?.partnerId || (req as any).partner?.id;

    if (tenantId) {
      req.tenantId = tenantId;
      // Run the rest of the request in tenant context
      tenantStorage.run({ tenantId, userId: (req as any).user?.id }, () => {
        next();
      });
    } else {
      next();
    }
  }
}
