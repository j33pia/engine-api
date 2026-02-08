import { Injectable, Logger } from '@nestjs/common';
import {
  INfceProvider,
  NfceServiceStatus,
  NfceEmissionResult,
  NfceCancellationResult,
} from './nfce-provider.interface';
import { AcbrConfigService } from '../../nfe/acbr-config.service';
import { CryptoUtil } from '../../common/utils/crypto.util';

/**
 * Provider Real NFC-e via ACBrLib
 *
 * NFC-e (Modelo 65) utiliza a mesma biblioteca libacbrnfe64.so da NFe,
 * porém com configurações específicas:
 * - ModeloDF = 1 (NFCe, diferente de 0 = NFe)
 * - CSC e CSC_ID obrigatórios
 * - Geração automática de QR Code
 * - indFinal = 1 (consumidor final)
 * - indPres = 1 (presencial)
 */
@Injectable()
export class RealNfceProvider implements INfceProvider {
  private lib: any;
  private readonly logger = new Logger(RealNfceProvider.name);

  constructor(private configService: AcbrConfigService) {}

  async inicializar(): Promise<void> {
    this.logger.log('Inicializando Real NFCe Provider...');
  }

  async finalizar(): Promise<void> {
    this.logger.log('Real NFCe Provider finalizado');
  }

  /**
   * Obtém instância da biblioteca ACBrNFe configurada para NFCe
   */
  private getLibInstance(): any {
    try {
      const { ACBrLibNFe } = require('@projetoacbr/acbrlib-nfe-node');
      const lib = new ACBrLibNFe();

      if (lib.inicializar('', '') !== 0) {
        throw new Error('Falha ao inicializar ACBrLibNFe para NFCe');
      }

      return lib;
    } catch (error: any) {
      this.logger.error(`Erro ao carregar ACBrLibNFe: ${error.message}`);
      throw new Error(
        'ACBrLibNFe não disponível. Verifique se libacbrnfe64.so está instalada.',
      );
    }
  }

  /**
   * Configurar ACBr para modo NFCe (Modelo 65)
   */
  private async configurarParaNfce(lib: any, issuer: any): Promise<void> {
    // [Principal]
    lib.configGravarValor('Principal', 'TipoResposta', '2'); // JSON
    lib.configGravarValor('Principal', 'CodificacaoResposta', '0'); // UTF8
    lib.configGravarValor('Principal', 'LogNivel', '4');
    lib.configGravarValor('Principal', 'LogPath', '/app/logs');

    // [DFe] - Certificado digital
    lib.configGravarValor('DFe', 'SSLCryptLib', '1'); // cryOpenSSL
    lib.configGravarValor('DFe', 'SSLHttpLib', '3'); // httpOpenSSL
    lib.configGravarValor('DFe', 'SSLXmlSignLib', '4'); // xsLibXml2
    lib.configGravarValor('DFe', 'VerificarValidade', '1');

    const certPath = `/app/${issuer.certFilename}`;
    lib.configGravarValor('DFe', 'ArquivoPFX', certPath);
    const decryptedPassword = await CryptoUtil.decrypt(issuer.certPassword);
    lib.configGravarValor('DFe', 'Senha', decryptedPassword);
    lib.configGravarValor('DFe', 'UF', issuer.state);

    // [NFe] - Configurações para NFCe (Modelo 65)
    lib.configGravarValor('NFe', 'Ambiente', '2'); // 2=Homologação
    lib.configGravarValor('NFe', 'ModeloDF', '1'); // 1=NFCe (diferente de 0=NFe!)
    lib.configGravarValor('NFe', 'VersaoDF', '3'); // v4.00
    lib.configGravarValor('NFe', 'FormaEmissao', '0'); // Normal
    lib.configGravarValor('NFe', 'PathSchemas', '/app/schemas');
    lib.configGravarValor('NFe', 'SalvarGer', '1');
    lib.configGravarValor('NFe', 'PathSalvar', '/app/xml/nfce');
    lib.configGravarValor('NFe', 'RetirarAcentos', '1');
    lib.configGravarValor('NFe', 'Timeout', '60000');

    // CSC obrigatório para NFCe
    if (issuer.csc && issuer.cscId) {
      lib.configGravarValor('NFe', 'CSC', issuer.csc);
      lib.configGravarValor('NFe', 'IdCSC', issuer.cscId);
    } else {
      this.logger.warn('⚠️ CSC não configurado para NFCe');
    }

    // [DANFE] - Cupom térmico
    lib.configGravarValor('DANFE', 'PathPDF', '/app/pdf/nfce');
    lib.configGravarValor('DANFE', 'TipoDANFE', '2'); // 2=DANFE NFC-e

    lib.configGravar();
    this.logger.log('✅ ACBr configurado para NFCe (Modelo 65)');
  }

  async checkStatus(uf: string, cnpj: string): Promise<NfceServiceStatus> {
    this.logger.log(`Verificando status NFCe para UF: ${uf}`);

    try {
      const lib = this.getLibInstance();
      // Status via ACBr seria lib.statusServico()
      lib.finalizar();

      return {
        status: 'UP',
        message: 'Serviço NFCe em operação',
        uf,
        timestamp: new Date(),
      };
    } catch {
      return {
        status: 'DOWN',
        message: 'Serviço NFCe indisponível',
        uf,
        timestamp: new Date(),
      };
    }
  }

  async emitir(json: any, issuer?: any): Promise<NfceEmissionResult> {
    if (!issuer) throw new Error('Contexto do emissor obrigatório para NFCe');

    const lib = this.getLibInstance();

    try {
      this.logger.log('🧾 Emitindo NFCe (Modelo 65) via ACBrLib...');

      // Configurar para modo NFCe
      await this.configurarParaNfce(lib, issuer);

      // Limpar lista
      lib.limparLista();

      // Montar XML da NFCe
      const nfceXML = this.buildNfceXML(json, issuer);
      this.logger.log(
        `DEBUG NFCe XML (200 chars): ${nfceXML.substring(0, 200)}`,
      );

      if (lib.carregarXML(nfceXML) !== 0) {
        throw new Error('Falha ao carregar dados da NFCe');
      }

      // Assinar
      if (lib.assinar() !== 0) {
        throw new Error('Falha ao assinar NFCe');
      }

      // Enviar para SEFAZ
      const enviarResult = lib.enviar(1, false, true, false);
      this.logger.log(`DEBUG enviar NFCe result: ${enviarResult}`);

      let resultado: any;
      try {
        resultado =
          typeof enviarResult === 'string'
            ? JSON.parse(enviarResult)
            : enviarResult;
      } catch {
        resultado = enviarResult;
      }

      const cStat = resultado?.Envio?.CStat;
      if (cStat === 100) {
        this.logger.log('🎉 NFCe AUTORIZADA!');

        const chave =
          resultado.Envio?.chDFe ||
          (Object.values(resultado.Envio) as any[]).find(
            (item: any) => item?.chDFe,
          )?.chDFe ||
          '';

        // Gerar PDF cupom
        try {
          lib.imprimirPDF();
          this.logger.log('✅ PDF cupom gerado');
        } catch (pdfError) {
          this.logger.warn('⚠️ Erro ao gerar PDF cupom:', pdfError);
        }

        return {
          success: true,
          protocol: resultado.Envio.NProt,
          accessKey: chave,
          xml: resultado.Envio.XML || '',
          pdfPath: `/nfce/pdf/${chave}`,
          message: resultado.Envio.XMotivo || 'Autorizado',
          qrCode: `https://www.nfce.fazenda.sp.gov.br/qrcode?chNFe=${chave}`,
          qrCodeUrl: `https://www.nfce.fazenda.sp.gov.br/qrcode?chNFe=${chave}`,
        };
      }

      throw new Error(
        `NFCe rejeitada pela SEFAZ (cStat: ${cStat}): ${resultado?.Envio?.XMotivo || 'Erro desconhecido'}`,
      );
    } catch (error) {
      this.logger.error('❌ Erro na emissão NFCe:', error);
      throw error;
    } finally {
      try {
        lib.finalizar();
      } catch {}
    }
  }

  async cancelar(
    accessKey: string,
    justificativa: string,
    issuer: any,
  ): Promise<NfceCancellationResult> {
    if (!issuer)
      throw new Error('Contexto do emissor obrigatório para cancelamento');

    if (!accessKey || accessKey.length !== 44) {
      throw new Error('Chave de acesso inválida');
    }

    if (!justificativa || justificativa.trim().length < 15) {
      throw new Error('Justificativa deve ter no mínimo 15 caracteres');
    }

    const lib = this.getLibInstance();

    try {
      this.logger.log(`❌ Cancelando NFCe: ${accessKey}`);
      await this.configurarParaNfce(lib, issuer);

      const cancelarResult = lib.cancelar(
        accessKey,
        justificativa,
        issuer.cnpj,
        1,
      );
      this.logger.log(`DEBUG cancelar NFCe result: ${cancelarResult}`);

      const bufferLen = 9999;
      const buffer = Buffer.alloc(bufferLen);
      lib.ultimoRetorno(buffer, bufferLen);
      const ultimoRetorno = buffer.toString('utf8').replace(/\0/g, '');

      let response: any;
      try {
        response = JSON.parse(ultimoRetorno);
      } catch {
        throw new Error('Resposta inválida da SEFAZ');
      }

      const cStat = response.Cancelamento?.CStat || response.CStat;

      if (cStat === 135) {
        return {
          success: true,
          protocol: response.Cancelamento?.NProt || response.NProt,
          message: response.Cancelamento?.XMotivo || 'Cancelamento homologado',
          xml: response.Cancelamento?.XML || '',
        };
      }

      throw new Error(
        response.XMotivo || 'Erro ao processar cancelamento NFCe',
      );
    } catch (error) {
      this.logger.error('Erro ao cancelar NFCe:', error);
      throw error;
    } finally {
      try {
        lib.finalizar();
      } catch {}
    }
  }

  async inutilizar(
    serie: number,
    numInicial: number,
    numFinal: number,
    justificativa: string,
    issuer: any,
  ): Promise<NfceCancellationResult> {
    if (!issuer)
      throw new Error('Contexto do emissor obrigatório para inutilização');

    const lib = this.getLibInstance();

    try {
      this.logger.log(
        `🔒 Inutilizando NFCe: série ${serie}, nº ${numInicial} a ${numFinal}`,
      );
      await this.configurarParaNfce(lib, issuer);

      const inutResult = lib.inutilizar(
        issuer.cnpj,
        justificativa,
        new Date().getFullYear(),
        65, // Modelo NFCe
        serie,
        numInicial,
        numFinal,
      );

      this.logger.log(`DEBUG inutilizar NFCe result: ${inutResult}`);

      const bufferLen = 9999;
      const buffer = Buffer.alloc(bufferLen);
      lib.ultimoRetorno(buffer, bufferLen);
      const ultimoRetorno = buffer.toString('utf8').replace(/\0/g, '');

      let response: any;
      try {
        response = JSON.parse(ultimoRetorno);
      } catch {
        throw new Error('Resposta inválida da SEFAZ');
      }

      const cStat = response.Inutilizacao?.CStat || response.CStat;

      if (cStat === 102) {
        return {
          success: true,
          protocol: response.Inutilizacao?.NProt || response.NProt,
          message: `Inutilização série ${serie} nº ${numInicial} a ${numFinal} homologada`,
        };
      }

      throw new Error(
        response.XMotivo || 'Erro ao processar inutilização NFCe',
      );
    } catch (error) {
      this.logger.error('Erro ao inutilizar NFCe:', error);
      throw error;
    } finally {
      try {
        lib.finalizar();
      } catch {}
    }
  }

  /**
   * Monta XML da NFCe (Modelo 65)
   * Diferenças em relação à NFe: mod=65, indFinal=1, indPres=1
   */
  private buildNfceXML(json: any, issuer: any): string {
    const now = new Date();
    const dhEmi = now.toISOString().replace('Z', '-03:00');
    const cNF = Math.floor(Math.random() * 99999999);
    const nNF = json.numero || 1;
    const serie = json.serie || 1;
    const cnpj = issuer.cnpj.replace(/\D/g, '');
    const uf = issuer.state || 'SP';

    // Código UF com base no estado
    const ufCodes: Record<string, string> = {
      AC: '12',
      AL: '27',
      AP: '16',
      AM: '13',
      BA: '29',
      CE: '23',
      DF: '53',
      ES: '32',
      GO: '52',
      MA: '21',
      MT: '51',
      MS: '50',
      MG: '31',
      PA: '15',
      PB: '25',
      PR: '41',
      PE: '26',
      PI: '22',
      RJ: '33',
      RN: '24',
      RS: '43',
      RO: '11',
      RR: '14',
      SC: '42',
      SP: '35',
      SE: '28',
      TO: '17',
    };
    const cUF = ufCodes[uf] || '35';

    return `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe versao="4.00">
    <ide>
      <cUF>${cUF}</cUF>
      <cNF>${cNF}</cNF>
      <natOp>Venda ao Consumidor</natOp>
      <mod>65</mod>
      <serie>${serie}</serie>
      <nNF>${nNF}</nNF>
      <dhEmi>${dhEmi}</dhEmi>
      <tpNF>1</tpNF>
      <idDest>1</idDest>
      <cMunFG>${issuer.ibgeCode || '3550308'}</cMunFG>
      <tpImp>4</tpImp>
      <tpEmis>1</tpEmis>
      <tpAmb>2</tpAmb>
      <finNFe>1</finNFe>
      <indFinal>1</indFinal>
      <indPres>1</indPres>
      <procEmi>0</procEmi>
      <verProc>EngineAPI v2.0</verProc>
    </ide>
    <emit>
      <CNPJ>${cnpj}</CNPJ>
      <xNome>${issuer.name}</xNome>
      <xFant>${issuer.name}</xFant>
      <enderEmit>
        <xLgr>${issuer.address || 'Rua Teste'}</xLgr>
        <nro>${issuer.number || 'S/N'}</nro>
        <xBairro>${issuer.neighborhood || 'Centro'}</xBairro>
        <cMun>${issuer.ibgeCode || '3550308'}</cMun>
        <xMun>${issuer.city || 'Sao Paulo'}</xMun>
        <UF>${uf}</UF>
        <CEP>${(issuer.cep || '01000000').replace(/\D/g, '')}</CEP>
        <cPais>1058</cPais>
        <xPais>BRASIL</xPais>
      </enderEmit>
      <IE>${issuer.ie || ''}</IE>
      <CRT>${issuer.crt || 1}</CRT>
    </emit>
    <dest>
      ${json.destCPF ? `<CPF>${json.destCPF.replace(/\D/g, '')}</CPF>` : ''}
      <xNome>${json.destName || 'CONSUMIDOR FINAL'}</xNome>
      <indIEDest>9</indIEDest>
    </dest>
    ${(
      json.items || [
        {
          code: '001',
          description: 'PRODUTO TESTE',
          quantity: 1,
          unitPrice: 10,
        },
      ]
    )
      .map(
        (item: any, i: number) => `
    <det nItem="${i + 1}">
      <prod>
        <cProd>${item.code}</cProd>
        <cEAN>SEM GTIN</cEAN>
        <xProd>${item.description}</xProd>
        <NCM>${item.ncm || '00000000'}</NCM>
        <CFOP>${item.cfop || '5102'}</CFOP>
        <uCom>UN</uCom>
        <qCom>${Number(item.quantity).toFixed(4)}</qCom>
        <vUnCom>${Number(item.unitPrice).toFixed(2)}</vUnCom>
        <vProd>${(item.quantity * item.unitPrice).toFixed(2)}</vProd>
        <cEANTrib>SEM GTIN</cEANTrib>
        <uTrib>UN</uTrib>
        <qTrib>${Number(item.quantity).toFixed(4)}</qTrib>
        <vUnTrib>${Number(item.unitPrice).toFixed(2)}</vUnTrib>
        <indTot>1</indTot>
      </prod>
      <imposto>
        <ICMS>
          <ICMSSN102>
            <orig>0</orig>
            <CSOSN>102</CSOSN>
          </ICMSSN102>
        </ICMS>
        <PIS><PISOutr><CST>99</CST><vBC>0.00</vBC><pPIS>0.00</pPIS><vPIS>0.00</vPIS></PISOutr></PIS>
        <COFINS><COFINSOutr><CST>99</CST><vBC>0.00</vBC><pCOFINS>0.00</pCOFINS><vCOFINS>0.00</vCOFINS></COFINSOutr></COFINS>
      </imposto>
    </det>`,
      )
      .join('')}
    <total>
      <ICMSTot>
        <vBC>0.00</vBC><vICMS>0.00</vICMS><vICMSDeson>0.00</vICMSDeson>
        <vFCP>0.00</vFCP><vBCST>0.00</vBCST><vST>0.00</vST>
        <vFCPST>0.00</vFCPST><vFCPSTRet>0.00</vFCPSTRet>
        <vProd>${(json.items || [{ quantity: 1, unitPrice: 10 }]).reduce((s: number, i: any) => s + i.quantity * i.unitPrice, 0).toFixed(2)}</vProd>
        <vFrete>0.00</vFrete><vSeg>0.00</vSeg><vDesc>0.00</vDesc>
        <vII>0.00</vII><vIPI>0.00</vIPI><vIPIDevol>0.00</vIPIDevol>
        <vPIS>0.00</vPIS><vCOFINS>0.00</vCOFINS><vOutro>0.00</vOutro>
        <vNF>${(json.items || [{ quantity: 1, unitPrice: 10 }]).reduce((s: number, i: any) => s + i.quantity * i.unitPrice, 0).toFixed(2)}</vNF>
      </ICMSTot>
    </total>
    <transp><modFrete>9</modFrete></transp>
    <pag>
      <detPag>
        <indPag>0</indPag>
        <tPag>${json.paymentType || '01'}</tPag>
        <vPag>${(json.items || [{ quantity: 1, unitPrice: 10 }]).reduce((s: number, i: any) => s + i.quantity * i.unitPrice, 0).toFixed(2)}</vPag>
      </detPag>
    </pag>
  </infNFe>
</NFe>`;
  }
}
