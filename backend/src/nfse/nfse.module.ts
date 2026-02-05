import { Module, Logger } from '@nestjs/common';
import { NfseController } from './nfse.controller';
import { NfseService } from './nfse.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MockNfseProvider } from './providers/mock-nfse.provider';
import { NFSE_PROVIDER } from './providers/nfse-provider.interface';

const logger = new Logger('NfseModule');

// Determina qual provider usar baseado no ambiente
const nfseProvider =
  process.env.NFSE_PROVIDER === 'real'
    ? null // ACBrNfseProvider - implementar quando necessário
    : MockNfseProvider;

if (nfseProvider === MockNfseProvider) {
  console.log(' Using MOCK NFSe Provider (Dev/Mac)');
}

@Module({
  imports: [PrismaModule],
  controllers: [NfseController],
  providers: [
    NfseService,
    {
      provide: NFSE_PROVIDER,
      useClass: MockNfseProvider, // Usar Mock por padrão
    },
  ],
  exports: [NfseService],
})
export class NfseModule {}
