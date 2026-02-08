import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IMdfeProvider } from './providers/mdfe-provider.interface';
import { MockMdfeProvider } from './providers/mdfe-mock.provider';
import { RealMdfeProvider } from './providers/mdfe-real.provider';

/**
 * Wrapper Service para MDF-e (Modelo 58)
 *
 * Seleciona automaticamente entre provider mock (desenvolvimento)
 * e provider real (produção Linux com ACBrLibMDFe).
 *
 * MDF-e utiliza biblioteca própria (libacbrmdfe64.so),
 * diferente da NFe/NFC-e.
 */
@Injectable()
export class MdfeWrapperService implements OnModuleInit {
  private provider: IMdfeProvider;
  private usingMock = false;
  private readonly logger = new Logger(MdfeWrapperService.name);

  constructor(
    private configService: ConfigService,
    private mockProvider: MockMdfeProvider,
    private realProvider: RealMdfeProvider,
  ) {}

  async onModuleInit() {
    const useMock =
      this.configService.get('USE_MDFE_MOCK') === 'true' ||
      this.configService.get('MDFE_PROVIDER') === 'mock' ||
      process.platform === 'darwin'; // Mac = desenvolvimento

    if (useMock) {
      this.logger.log('📦 Usando MOCK MDFe Provider (Dev)');
      this.provider = this.mockProvider;
      this.usingMock = true;
    } else {
      this.logger.log('📦 Usando REAL ACBr MDFe Provider (Prod)');
      this.provider = this.realProvider;
      this.usingMock = false;
    }

    await this.provider.inicializar();
  }

  async checkStatus(uf: string, cnpj: string) {
    return this.provider.checkStatus(uf, cnpj);
  }

  async emitir(json: any, issuer: any) {
    return this.provider.emitir(json, issuer);
  }

  async encerrar(accessKey: string, ufEncerramento: string, issuer: any) {
    return this.provider.encerrar(accessKey, ufEncerramento, issuer);
  }

  async cancelar(accessKey: string, justificativa: string, issuer: any) {
    return this.provider.cancelar(accessKey, justificativa, issuer);
  }

  /** Verificar se está usando mock */
  isUsingMock(): boolean {
    return this.usingMock;
  }
}
