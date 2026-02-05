import { Module } from '@nestjs/common';
import { NfceController } from './nfce.controller';
import { NfceService } from './nfce.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NfeModule } from '../nfe/nfe.module';

@Module({
  imports: [PrismaModule, NfeModule],
  controllers: [NfceController],
  providers: [NfceService],
  exports: [NfceService],
})
export class NfceModule {}
