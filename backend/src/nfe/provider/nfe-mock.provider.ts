import { INfeProvider, ServiceStatus } from './nfe-provider.interface';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MockNfeProvider implements INfeProvider {
  private readonly logger = new Logger(MockNfeProvider.name);

  async inicializar(): Promise<void> {
    this.logger.log('MOCK NFe Provider initialized (Mac/Dev Environment)');
  }

  async finalizar(): Promise<void> {
    this.logger.log('MOCK NFe Provider finalized');
  }

  async checkStatus(uf: string, cnpj: string): Promise<ServiceStatus> {
    this.logger.log(`Checking Mock Status for UF: ${uf}, CNPJ: ${cnpj}`);

    // Simulating a real SEFAZ response delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      status: 'UP',
      message: 'Serviço em Operação (Ambiente Mock)',
      uf: uf,
      timestamp: new Date(),
    };
  }

  async emitir(
    json: any,
    issuer?: any,
  ): Promise<import('./nfe-provider.interface').EmissionResult> {
    this.logger.log('MOCK Emitting NFe...');
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate processing

    const randomAccessKey =
      '35' + new Date().getFullYear() + Math.random().toString().slice(2, 44);
    const protocol = Math.random().toString().slice(2, 15);

    return {
      success: true,
      accessKey: randomAccessKey,
      protocol: protocol,
      xml: '<xml>Mocked Signed XML</xml>',
      message: 'Autorizado o uso da NF-e',
    };
  }

  async cancelar(
    accessKey: string,
    justificativa: string,
    issuer?: any,
  ): Promise<import('./nfe-provider.interface').CancellationResult> {
    this.logger.log(`MOCK Canceling NFe ${accessKey}`);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate processing

    const protocol = Math.random().toString().slice(2, 15);

    return {
      success: true,
      protocol: protocol,
      message: 'Cancelamento homologado (Mock)',
      xml: '<xml>Mocked Cancellation XML</xml>',
    };
  }

  async enviarCartaCorrecao(
    accessKey: string,
    correcao: string,
    sequencia: number,
    issuer?: any,
  ): Promise<import('./nfe-provider.interface').CcEResult> {
    this.logger.log(
      `MOCK Sending CC-e for NFe ${accessKey} (seq ${sequencia})`,
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const protocol = Math.random().toString().slice(2, 15);

    return {
      success: true,
      protocol: protocol,
      sequence: sequencia,
      message: 'Evento registrado com sucesso (Mock)',
      xml: '<xml>Mocked CC-e XML</xml>',
    };
  }

  async emitirNfce(
    json: any,
    issuer?: any,
  ): Promise<import('./nfe-provider.interface').NfceEmissionResult> {
    this.logger.log('MOCK Emitting NFCe (Modelo 65)...');
    await new Promise((resolve) => setTimeout(resolve, 1200)); // Simulate processing

    const randomAccessKey =
      '35' +
      new Date().getFullYear() +
      '65' +
      Math.random().toString().slice(2, 40);
    const protocol = Math.random().toString().slice(2, 15);
    const qrCode = `https://www.nfce.fazenda.sp.gov.br/qrcode?chNFe=${randomAccessKey}`;

    return {
      success: true,
      accessKey: randomAccessKey,
      protocol: protocol,
      xml: '<xml>Mocked NFCe Signed XML</xml>',
      message: 'Autorizado o uso da NFC-e (Mock)',
      qrCode: qrCode,
    };
  }

  /**
   * Mock MDFe emission (Modelo 58)
   */
  async emitirMdfe(
    json: any,
    issuer?: any,
  ): Promise<import('./nfe-provider.interface').EmissionResult> {
    this.logger.log('📦 MOCK Emitting MDFe (Modelo 58)...');
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate processing

    const randomAccessKey =
      '35' +
      new Date().getFullYear() +
      '58' +
      Math.random().toString().slice(2, 40);
    const protocol = Math.random().toString().slice(2, 15);

    this.logger.log(`✅ MOCK MDFe emitted: ${randomAccessKey}`);

    return {
      success: true,
      accessKey: randomAccessKey,
      protocol: protocol,
      xml: '<xml>Mocked MDFe Signed XML</xml>',
      message: 'Autorizado o uso do MDF-e (Mock)',
    };
  }

  /**
   * Mock MDFe encerramento
   */
  async encerrarMdfe(
    accessKey: string,
    ufEncerramento: string,
    issuer?: any,
  ): Promise<import('./nfe-provider.interface').CancellationResult> {
    this.logger.log(
      `🔒 MOCK Encerrar MDFe: ${accessKey} UF: ${ufEncerramento}`,
    );
    await new Promise((resolve) => setTimeout(resolve, 800));

    const protocol = Math.random().toString().slice(2, 15);

    return {
      success: true,
      protocol: protocol,
      message: 'MDF-e encerrado com sucesso (Mock)',
    };
  }
}
