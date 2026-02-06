import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CertificateSchedulerService } from './certificate.scheduler';
import { PrismaModule } from '../prisma/prisma.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, WebhooksModule],
  providers: [CertificateSchedulerService],
  exports: [CertificateSchedulerService],
})
export class SchedulerModule {}
