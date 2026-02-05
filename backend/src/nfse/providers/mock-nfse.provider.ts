import { Injectable, Logger } from '@nestjs/common';
import { NfseProvider } from './nfse-provider.interface';

/**
 * Mock Provider para desenvolvimento
 * Simula emissão de NFSe sem conectar a WebServices municipais
 */
@Injectable()
export class MockNfseProvider implements NfseProvider {
  private readonly logger = new Logger(MockNfseProvider.name);

  async configurarMunicipio(
    codigoIBGE: string,
    certPath: string,
    certPassword: string,
  ): Promise<void> {
    this.logger.log(`[MOCK] Configurando município: ${codigoIBGE}`);
    // Mock - não faz nada
  }

  async emitir(nfseData: any): Promise<{
    success: boolean;
    numero?: string;
    codigoVerificacao?: string;
    dataEmissao?: Date;
    xmlContent?: string;
    protocolo?: string;
    error?: string;
  }> {
    this.logger.log('[MOCK] Emitindo NFSe...');

    // Simula processamento
    await new Promise((resolve) => setTimeout(resolve, 500));

    const numero = String(Math.floor(Math.random() * 999999)).padStart(6, '0');
    const codigoVerificacao = this.gerarCodigoVerificacao();

    const xmlContent = this.gerarXmlMock(nfseData, numero, codigoVerificacao);

    return {
      success: true,
      numero,
      codigoVerificacao,
      dataEmissao: new Date(),
      xmlContent,
      protocolo: `MOCK${Date.now()}`,
    };
  }

  async cancelar(
    numero: string,
    codigoVerificacao: string,
    motivo: string,
  ): Promise<{
    success: boolean;
    protocolo?: string;
    error?: string;
  }> {
    this.logger.log(`[MOCK] Cancelando NFSe ${numero}...`);

    return {
      success: true,
      protocolo: `CANC${Date.now()}`,
    };
  }

  async consultar(numero: string): Promise<{
    success: boolean;
    status?: string;
    xmlContent?: string;
    error?: string;
  }> {
    this.logger.log(`[MOCK] Consultando NFSe ${numero}...`);

    return {
      success: true,
      status: 'AUTORIZADA',
    };
  }

  async gerarPdf(xmlContent: string): Promise<Buffer | string> {
    this.logger.log('[MOCK] Gerando PDF da NFSe...');

    // Retorna HTML simulando PDF
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>NFSe - Documento Auxiliar</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .titulo { font-size: 24px; font-weight: bold; color: #1a365d; }
          .mock-badge { background: #f59e0b; color: white; padding: 5px 10px; border-radius: 5px; }
          .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
          .label { font-weight: bold; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="titulo">NOTA FISCAL DE SERVIÇOS ELETRÔNICA - NFSe</div>
          <span class="mock-badge">AMBIENTE DE DESENVOLVIMENTO</span>
        </div>
        <div class="section">
          <p><span class="label">Número:</span> NFSe gerada em modo MOCK</p>
          <p><span class="label">Data:</span> ${new Date().toLocaleString('pt-BR')}</p>
          <p><span class="label">Observação:</span> Este documento foi gerado em ambiente de desenvolvimento.</p>
        </div>
      </body>
      </html>
    `;
  }

  private gerarCodigoVerificacao(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';
    for (let i = 0; i < 8; i++) {
      codigo += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return codigo;
  }

  private gerarXmlMock(
    data: any,
    numero: string,
    codigoVerificacao: string,
  ): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<CompNfse xmlns="http://www.abrasf.org.br/nfse.xsd">
  <Nfse>
    <InfNfse>
      <Numero>${numero}</Numero>
      <CodigoVerificacao>${codigoVerificacao}</CodigoVerificacao>
      <DataEmissao>${new Date().toISOString()}</DataEmissao>
      <NaturezaOperacao>1</NaturezaOperacao>
      <Servico>
        <ItemListaServico>${data.servico?.itemListaServico || '1.01'}</ItemListaServico>
        <Discriminacao>${data.servico?.discriminacao || 'Serviço'}</Discriminacao>
        <CodigoMunicipio>${data.servico?.codigoMunicipio || '3550308'}</CodigoMunicipio>
        <Valores>
          <ValorServicos>${data.servico?.valorServicos || 0}</ValorServicos>
        </Valores>
      </Servico>
      <PrestadorServico>
        <IdentificacaoPrestador>
          <CpfCnpj><Cnpj>00000000000000</Cnpj></CpfCnpj>
        </IdentificacaoPrestador>
      </PrestadorServico>
      <TomadorServico>
        <IdentificacaoTomador>
          <CpfCnpj><Cnpj>${data.tomador?.cnpjCpf || '00000000000000'}</Cnpj></CpfCnpj>
        </IdentificacaoTomador>
        <RazaoSocial>${data.tomador?.razaoSocial || 'Tomador'}</RazaoSocial>
      </TomadorServico>
    </InfNfse>
  </Nfse>
  <!-- MOCK: Documento gerado em ambiente de desenvolvimento -->
</CompNfse>`;
  }
}
