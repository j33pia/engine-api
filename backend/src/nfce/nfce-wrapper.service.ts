import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { INfceProvider } from './providers/nfce-provider.interface';
import { MockNfceProvider } from './providers/nfce-mock.provider';
import { RealNfceProvider } from './providers/nfce-real.provider';

/**
 * Wrapper Service para NFC-e (Modelo 65)
 *
 * Seleciona automaticamente entre provider mock (desenvolvimento)
 * e provider real (produção Linux com ACBrLib).
 *
 * NFC-e utiliza a mesma libacbrnfe64.so da NFe, mas com
 * configurações específicas (ModeloDF=1, CSC obrigatório).
 */
@Injectable()
export class NfceWrapperService implements OnModuleInit {
  private provider: INfceProvider;
  private usingMock = false;
  private readonly logger = new Logger(NfceWrapperService.name);

  constructor(
    private configService: ConfigService,
    private mockProvider: MockNfceProvider,
    private realProvider: RealNfceProvider,
  ) {}

  async onModuleInit() {
    const useMock =
      this.configService.get('USE_NFCE_MOCK') === 'true' ||
      this.configService.get('NFCE_PROVIDER') === 'mock' ||
      this.configService.get('USE_NFE_MOCK') === 'true' ||
      process.platform === 'darwin'; // Mac = desenvolvimento

    if (useMock) {
      this.logger.log('🧾 Usando MOCK NFCe Provider (Dev)');
      this.provider = this.mockProvider;
      this.usingMock = true;
    } else {
      this.logger.log('🧾 Usando REAL ACBr NFCe Provider (Prod)');
      this.provider = this.realProvider;
      this.usingMock = false;
    }

    await this.provider.inicializar();
  }

  async checkStatus(uf: string, cnpj: string) {
    return this.provider.checkStatus(uf, cnpj);
  }

  async emitir(json: any, issuer: any) {
    try {
      return await this.provider.emitir(json, issuer);
    } catch (error: any) {
      this.logger.error('Erro na emissão NFCe:', error);

      let userMessage = error.message || 'Erro desconhecido na emissão NFCe';

      if (userMessage.includes('CSC') || userMessage.includes('csc')) {
        userMessage = `Erro de CSC: ${userMessage}. Configure o CSC e o ID do CSC no cadastro da empresa para emitir NFCe.`;
      }

      if (
        userMessage.includes('certificado') ||
        userMessage.includes('Certificado')
      ) {
        userMessage = `Erro de certificado digital: ${userMessage}. Verifique se o certificado está válido.`;
      }

      throw new Error(userMessage);
    }
  }

  async cancelar(accessKey: string, justificativa: string, issuer: any) {
    return this.provider.cancelar(accessKey, justificativa, issuer);
  }

  async inutilizar(
    serie: number,
    numInicial: number,
    numFinal: number,
    justificativa: string,
    issuer: any,
  ) {
    return this.provider.inutilizar(
      serie,
      numInicial,
      numFinal,
      justificativa,
      issuer,
    );
  }

  /** Verificar se está usando mock */
  isUsingMock(): boolean {
    return this.usingMock;
  }
}
