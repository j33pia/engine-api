import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NfseProvider } from './providers/nfse-provider.interface';
import { MockNfseProvider } from './providers/mock-nfse.provider';
import { RealNfseProvider } from './providers/real-nfse.provider';

/**
 * Wrapper Service para NFS-e
 *
 * Seleciona automaticamente entre provider mock (desenvolvimento)
 * e provider real (produção Linux com ACBrLibNFSe).
 *
 * NFS-e utiliza biblioteca própria (libacbrnfse64.so) e
 * suporta múltiplos padrões municipais via ACBr.
 */
@Injectable()
export class NfseWrapperService implements OnModuleInit {
  private provider: NfseProvider;
  private usingMock = false;
  private readonly logger = new Logger(NfseWrapperService.name);

  constructor(
    private configService: ConfigService,
    private mockProvider: MockNfseProvider,
    private realProvider: RealNfseProvider,
  ) {}

  async onModuleInit() {
    const useMock =
      this.configService.get('USE_NFSE_MOCK') === 'true' ||
      this.configService.get('NFSE_PROVIDER') === 'mock' ||
      process.platform === 'darwin';

    if (useMock) {
      this.logger.log('📋 Usando MOCK NFSe Provider (Dev)');
      this.provider = this.mockProvider;
      this.usingMock = true;
    } else {
      this.logger.log('📋 Usando REAL ACBr NFSe Provider (Prod)');
      this.provider = this.realProvider;
      this.usingMock = false;
    }
  }

  get activeProvider(): NfseProvider {
    return this.provider;
  }

  isUsingMock(): boolean {
    return this.usingMock;
  }
}
