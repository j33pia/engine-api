import { Module, Global } from '@nestjs/common';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [AuditInterceptor],
  exports: [AuditInterceptor],
})
export class CommonModule {}
