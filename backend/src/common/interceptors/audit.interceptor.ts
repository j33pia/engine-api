import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, path, tenantId, user, ip } = request;
    const startTime = Date.now();

    // Skip health checks and options
    if (path === '/health' || method === 'OPTIONS') {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: async (response) => {
          if (tenantId) {
            await this.logAction({
              partnerId: tenantId,
              userId: user?.id,
              action: `${method} ${path}`,
              status: 'SUCCESS',
              duration: Date.now() - startTime,
              ip,
              metadata: this.sanitizeMetadata(request.body),
            });
          }
        },
        error: async (error) => {
          if (tenantId) {
            await this.logAction({
              partnerId: tenantId,
              userId: user?.id,
              action: `${method} ${path}`,
              status: 'ERROR',
              duration: Date.now() - startTime,
              ip,
              metadata: { error: error.message },
            });
          }
        },
      }),
    );
  }

  private async logAction(data: {
    partnerId: string;
    userId?: string;
    action: string;
    status: string;
    duration: number;
    ip?: string;
    metadata?: any;
  }) {
    try {
      await this.prisma.auditLog.create({ data });
    } catch (err) {
      this.logger.warn(`Failed to create audit log: ${err.message}`);
    }
  }

  private sanitizeMetadata(body: any): any {
    if (!body) return null;

    // Remove sensitive fields
    const sanitized = { ...body };
    const sensitiveFields = [
      'password',
      'apiKey',
      'secret',
      'certificate',
      'certPassword',
    ];
    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}
