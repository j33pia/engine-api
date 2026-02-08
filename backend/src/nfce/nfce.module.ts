import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NfceController } from './nfce.controller';
import { NfceService } from './nfce.service';
import { NfceWrapperService } from './nfce-wrapper.service';
import { MockNfceProvider } from './providers/nfce-mock.provider';
import { RealNfceProvider } from './providers/nfce-real.provider';
import { PrismaModule } from '../prisma/prisma.module';
import { NfeModule } from '../nfe/nfe.module';

@Module({
  imports: [PrismaModule, ConfigModule, NfeModule],
  controllers: [NfceController],
  providers: [
    NfceService,
    NfceWrapperService,
    MockNfceProvider,
    RealNfceProvider,
  ],
  exports: [NfceService, NfceWrapperService],
})
export class NfceModule {}
