import { Injectable, Logger } from '@nestjs/common';
import {
  INfceProvider,
  NfceServiceStatus,
  NfceEmissionResult,
  NfceCancellationResult,
} from './nfce-provider.interface';

/**
 * Mock Provider NFC-e para ambiente de desenvolvimento (Mac/Dev)
 *
 * Simula as operações de emissão, cancelamento e inutilização
 * de NFCe sem necessidade da biblioteca ACBr ou acesso à SEFAZ.
 */
@Injectable()
export class MockNfceProvider implements INfceProvider {
  private readonly logger = new Logger(MockNfceProvider.name);

  async inicializar(): Promise<void> {
    this.logger.log('✅ MOCK NFCe Provider inicializado (Ambiente Dev)');
  }

  async finalizar(): Promise<void> {
    this.logger.log('MOCK NFCe Provider finalizado');
  }

  async checkStatus(uf: string, cnpj: string): Promise<NfceServiceStatus> {
    this.logger.log(`Verificando status Mock NFCe para UF: ${uf}`);
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      status: 'UP',
      message: 'Serviço NFCe em Operação (Ambiente Mock)',
      uf,
      timestamp: new Date(),
    };
  }

  async emitir(json: any, issuer?: any): Promise<NfceEmissionResult> {
    this.logger.log('🧾 MOCK Emitindo NFCe (Modelo 65)...');
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const uf = issuer?.state === 'SP' ? '35' : '31';
    const randomAccessKey =
      uf +
      new Date().getFullYear().toString().slice(2) +
      '01' +
      '65' +
      Math.random().toString().slice(2, 40);
    const protocol = Math.random().toString().slice(2, 15);
    const qrCode = `https://www.nfce.fazenda.sp.gov.br/qrcode?chNFe=${randomAccessKey}&nVersao=100&tpAmb=2`;

    this.logger.log(`✅ MOCK NFCe emitida: ${randomAccessKey}`);

    return {
      success: true,
      accessKey: randomAccessKey,
      protocol,
      xml: `<?xml version="1.0"?><nfeProc><NFe><infNFe Id="NFe${randomAccessKey}"><ide><mod>65</mod></ide></infNFe></NFe></nfeProc>`,
      message: 'Autorizado o uso da NFC-e (Mock)',
      qrCode,
      qrCodeUrl: qrCode,
    };
  }

  async cancelar(
    accessKey: string,
    justificativa: string,
    issuer?: any,
  ): Promise<NfceCancellationResult> {
    this.logger.log(`❌ MOCK Cancelando NFCe: ${accessKey}`);
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      success: true,
      protocol: Math.random().toString().slice(2, 15),
      message: 'Cancelamento NFCe homologado (Mock)',
      xml: '<xml>Mocked NFCe Cancellation XML</xml>',
    };
  }

  async inutilizar(
    serie: number,
    numInicial: number,
    numFinal: number,
    justificativa: string,
    issuer?: any,
  ): Promise<NfceCancellationResult> {
    this.logger.log(
      `🔒 MOCK Inutilizando NFCe: série ${serie}, nº ${numInicial} a ${numFinal}`,
    );
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      success: true,
      protocol: Math.random().toString().slice(2, 15),
      message: `Inutilização NFCe série ${serie} nº ${numInicial} a ${numFinal} homologada (Mock)`,
    };
  }
}
