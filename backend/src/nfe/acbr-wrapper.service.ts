import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { INfeProvider } from './provider/nfe-provider.interface';
import { MockNfeProvider } from './provider/nfe-mock.provider';
import { RealNfeProvider } from './provider/nfe-real.provider';

@Injectable()
export class AcbrWrapperService implements OnModuleInit {
  private provider: INfeProvider;
  private usingMock: boolean = false;
  private acbrError: string | null = null;
  private readonly logger = new Logger(AcbrWrapperService.name);

  constructor(
    private configService: ConfigService,
    private mockProvider: MockNfeProvider,
    private realProvider: RealNfeProvider,
  ) {}

  async onModuleInit() {
    const useMock =
      this.configService.get('USE_NFE_MOCK') === 'true' ||
      this.configService.get('NFE_PROVIDER') === 'mock' ||
      process.platform === 'darwin';

    if (useMock) {
      console.log(' Using MOCK NFe Provider (Mac/Dev)');
      this.provider = this.mockProvider;
      this.usingMock = true;
    } else {
      console.log(' Using REAL ACBr NFe Provider (Linux/Prod)');
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
      const result = await this.provider.emitir(json, issuer);
      return result;
    } catch (error: any) {
      this.logger.error('Erro na emissão NFe:', error);

      // Melhorar mensagem de erro para o usuário
      let userMessage = error.message || 'Erro desconhecido na emissão';

      // Erros comuns e suas explicações
      if (
        userMessage.includes('CNPJ inválido') ||
        userMessage.includes('Falha na validação')
      ) {
        userMessage = `Erro de validação do XML: ${userMessage}. Verifique se os dados da empresa estão completos (CNPJ, endereço, IE).`;
      }

      if (
        userMessage.includes('certificado') ||
        userMessage.includes('Certificado')
      ) {
        userMessage = `Erro de certificado digital: ${userMessage}. Verifique se o certificado foi carregado corretamente e se a senha está correta.`;
      }

      if (
        userMessage.includes('Signature') ||
        userMessage.includes('namespace')
      ) {
        userMessage = `Erro de assinatura XML: O ACBrLib encontrou um problema ao assinar o documento. Isso pode ser um problema de compatibilidade da biblioteca. Tente novamente ou contate o suporte.`;
      }

      throw new Error(userMessage);
    }
  }

  async cancelar(accessKey: string, justificativa: string, issuer: any) {
    return this.provider.cancelar(accessKey, justificativa, issuer);
  }

  async enviarCartaCorrecao(
    accessKey: string,
    correcao: string,
    sequencia: number,
    issuer: any,
  ) {
    return this.provider.enviarCartaCorrecao(
      accessKey,
      correcao,
      sequencia,
      issuer,
    );
  }

  /**
   * Emitir NFCe (Modelo 65)
   */
  async emitirNfce(json: any, issuer: any) {
    try {
      const result = await this.provider.emitirNfce(json, issuer);
      return result;
    } catch (error: any) {
      this.logger.error('Erro na emissão NFCe:', error);
      let userMessage = error.message || 'Erro desconhecido na emissão NFCe';

      if (userMessage.includes('CSC')) {
        userMessage = `Erro de CSC: ${userMessage}. Configure o CSC no cadastro da empresa para emitir NFCe.`;
      }

      throw new Error(userMessage);
    }
  }

  /**
   * Emitir MDFe (Modelo 58)
   */
  async emitirMdfe(json: any, issuer: any) {
    try {
      this.logger.log('📦 Emitindo MDFe (Modelo 58)...');
      const result = await this.provider.emitirMdfe(json, issuer);
      return result;
    } catch (error: any) {
      this.logger.error('Erro na emissão MDFe:', error);
      throw new Error(error.message || 'Erro desconhecido na emissão MDFe');
    }
  }

  /**
   * Encerrar MDFe
   */
  async encerrarMdfe(accessKey: string, ufEncerramento: string, issuer: any) {
    try {
      this.logger.log(`🔒 Encerrando MDFe: ${accessKey}`);
      const result = await this.provider.encerrarMdfe(
        accessKey,
        ufEncerramento,
        issuer,
      );
      return result;
    } catch (error: any) {
      this.logger.error('Erro ao encerrar MDFe:', error);
      throw new Error(error.message || 'Erro desconhecido ao encerrar MDFe');
    }
  }

  // Método para verificar se está usando mock
  isUsingMock(): boolean {
    return this.usingMock;
  }
}
