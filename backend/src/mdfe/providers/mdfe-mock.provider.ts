import { Injectable, Logger } from '@nestjs/common';
import {
  IMdfeProvider,
  MdfeServiceStatus,
  MdfeEmissionResult,
  MdfeEncerrarResult,
  MdfeCancellationResult,
} from './mdfe-provider.interface';

/**
 * Mock Provider MDF-e para ambiente de desenvolvimento (Mac/Dev)
 *
 * Simula as operações de emissão, encerramento e cancelamento
 * de MDFe sem necessidade da biblioteca ACBrMDFe ou acesso à SEFAZ.
 */
@Injectable()
export class MockMdfeProvider implements IMdfeProvider {
  private readonly logger = new Logger(MockMdfeProvider.name);

  async inicializar(): Promise<void> {
    this.logger.log('✅ MOCK MDFe Provider inicializado (Ambiente Dev)');
  }

  async finalizar(): Promise<void> {
    this.logger.log('MOCK MDFe Provider finalizado');
  }

  async checkStatus(uf: string, cnpj: string): Promise<MdfeServiceStatus> {
    this.logger.log(`Verificando status Mock MDFe para UF: ${uf}`);
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      status: 'UP',
      message: 'Serviço MDFe em Operação (Ambiente Mock)',
      uf,
      timestamp: new Date(),
    };
  }

  async emitir(json: any, issuer?: any): Promise<MdfeEmissionResult> {
    this.logger.log('📦 MOCK Emitindo MDFe (Modelo 58)...');
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const uf = issuer?.state === 'SP' ? '35' : '52';
    const randomAccessKey =
      uf +
      new Date().getFullYear().toString().slice(2) +
      '01' +
      '58' +
      Math.random().toString().slice(2, 40);
    const protocol = Math.random().toString().slice(2, 15);

    this.logger.log(`✅ MOCK MDFe emitido: ${randomAccessKey}`);

    return {
      success: true,
      accessKey: randomAccessKey,
      protocol,
      xml: `<?xml version="1.0"?><mdfeProc><MDFe><infMDFe Id="MDFe${randomAccessKey}"><ide><mod>58</mod></ide></infMDFe></MDFe></mdfeProc>`,
      xmlPath: `/app/xml/mdfe/${randomAccessKey}-mdfe.xml`,
      pdfPath: `/app/pdf/mdfe/${randomAccessKey}-damdfe.pdf`,
      message: 'Autorizado o uso do MDF-e (Mock)',
    };
  }

  async encerrar(
    accessKey: string,
    ufEncerramento: string,
    issuer?: any,
  ): Promise<MdfeEncerrarResult> {
    this.logger.log(
      `🔒 MOCK Encerrando MDFe: ${accessKey} UF: ${ufEncerramento}`,
    );
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      success: true,
      protocol: Math.random().toString().slice(2, 15),
      message: 'MDF-e encerrado com sucesso (Mock)',
      xml: '<xml>Mocked MDFe Encerramento XML</xml>',
    };
  }

  async cancelar(
    accessKey: string,
    justificativa: string,
    issuer?: any,
  ): Promise<MdfeCancellationResult> {
    this.logger.log(`❌ MOCK Cancelando MDFe: ${accessKey}`);
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      success: true,
      protocol: Math.random().toString().slice(2, 15),
      message: 'Cancelamento MDFe homologado (Mock)',
      xml: '<xml>Mocked MDFe Cancellation XML</xml>',
    };
  }
}
