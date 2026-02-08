import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NfseController } from './nfse.controller';
import { NfseService } from './nfse.service';
import { NfseWrapperService } from './nfse-wrapper.service';
import { MockNfseProvider } from './providers/mock-nfse.provider';
import { RealNfseProvider } from './providers/real-nfse.provider';
import { NFSE_PROVIDER } from './providers/nfse-provider.interface';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [NfseController],
  providers: [
    NfseService,
    NfseWrapperService,
    MockNfseProvider,
    RealNfseProvider,
    {
      provide: NFSE_PROVIDER,
      useFactory: (wrapper: NfseWrapperService) => wrapper.activeProvider,
      inject: [NfseWrapperService],
    },
  ],
  exports: [NfseService, NfseWrapperService],
})
export class NfseModule {}
