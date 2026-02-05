import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CompaniesModule } from './companies/companies.module';
import { NfeModule } from './nfe/nfe.module';
import { NfceModule } from './nfce/nfce.module';
import { MdfeModule } from './mdfe/mdfe.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { NfseModule } from './nfse/nfse.module';
import { CommonModule } from './common/common.module';
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PartnersModule } from './partners/partners.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CommonModule,
    CompaniesModule,
    NfeModule,
    NfceModule,
    MdfeModule,
    NfseModule,
    AuthModule,
    PartnersModule,
    AnalyticsModule,
    WebhooksModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
