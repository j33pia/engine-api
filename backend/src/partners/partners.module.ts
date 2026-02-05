import { Module } from '@nestjs/common';
import { PartnersService } from './partners.service';
import { PartnersController } from './partners.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WebhookService } from './webhook.service';

@Module({
    imports: [PrismaModule],
    controllers: [PartnersController],
    providers: [PartnersService, WebhookService],
    exports: [PartnersService, WebhookService],
})
export class PartnersModule { }
