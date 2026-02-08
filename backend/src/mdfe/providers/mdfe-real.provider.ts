import { Injectable, Logger } from '@nestjs/common';
import {
  IMdfeProvider,
  MdfeServiceStatus,
  MdfeEmissionResult,
  MdfeEncerrarResult,
  MdfeCancellationResult,
} from './mdfe-provider.interface';
import { AcbrConfigService } from '../../nfe/acbr-config.service';
import { CryptoUtil } from '../../common/utils/crypto.util';

/**
 * Provider Real MDF-e via ACBrLibMDFe
 *
 * MDF-e (Modelo 58) utiliza biblioteca própria (libacbrmdfe64.so),
 * diferente da NFe/NFC-e. Binding via @projetoacbr/acbrlib-mdfe-node.
 *
 * Documentação ACBrLibMDFe:
 * - Namespace: http://www.portalfiscal.inf.br/mdfe
 * - Versão: 3.00
 * - XML Schema: mdfe_v3.00.xsd
 */
@Injectable()
export class RealMdfeProvider implements IMdfeProvider {
  private lib: any;
  private readonly logger = new Logger(RealMdfeProvider.name);

  constructor(private configService: AcbrConfigService) {}

  async inicializar(): Promise<void> {
    this.logger.log('Inicializando Real MDFe Provider...');
  }

  async finalizar(): Promise<void> {
    this.logger.log('Real MDFe Provider finalizado');
  }

  /**
   * Obtém instância da biblioteca ACBrMDFe
   */
  private getLibInstance(): any {
    try {
      const { ACBrLibMDFe } = require('@projetoacbr/acbrlib-mdfe-node');
      const lib = new ACBrLibMDFe();

      if (lib.inicializar('', '') !== 0) {
        throw new Error('Falha ao inicializar ACBrLibMDFe');
      }

      return lib;
    } catch (error: any) {
      this.logger.error(`Erro ao carregar ACBrLibMDFe: ${error.message}`);
      throw new Error(
        'ACBrLibMDFe não disponível. Verifique se libacbrmdfe64.so está instalada.',
      );
    }
  }

  /**
   * Configurar ACBr para MDF-e
   */
  private async configurarParaMdfe(lib: any, issuer: any): Promise<void> {
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

    // [MDFe] - Configurações específicas do MDF-e
    lib.configGravarValor('MDFe', 'Ambiente', '2'); // 2=Homologação
    lib.configGravarValor('MDFe', 'VersaoDF', '1'); // v3.00
    lib.configGravarValor('MDFe', 'FormaEmissao', '0'); // Normal
    lib.configGravarValor('MDFe', 'PathSchemas', '/app/schemas/mdfe');
    lib.configGravarValor('MDFe', 'SalvarGer', '1');
    lib.configGravarValor('MDFe', 'PathSalvar', '/app/xml/mdfe');
    lib.configGravarValor('MDFe', 'RetirarAcentos', '1');
    lib.configGravarValor('MDFe', 'Timeout', '60000');

    // [DAMDFE] - PDF
    lib.configGravarValor('DAMDFE', 'PathPDF', '/app/pdf/mdfe');

    lib.configGravar();
    this.logger.log('✅ ACBr configurado para MDFe');
  }

  async checkStatus(uf: string, cnpj: string): Promise<MdfeServiceStatus> {
    this.logger.log(`Verificando status MDFe para UF: ${uf}`);

    try {
      const lib = this.getLibInstance();
      lib.finalizar();

      return {
        status: 'UP',
        message: 'Serviço MDFe em operação',
        uf,
        timestamp: new Date(),
      };
    } catch {
      return {
        status: 'DOWN',
        message: 'Serviço MDFe indisponível',
        uf,
        timestamp: new Date(),
      };
    }
  }

  async emitir(json: any, issuer?: any): Promise<MdfeEmissionResult> {
    if (!issuer) throw new Error('Contexto do emissor obrigatório para MDFe');

    const lib = this.getLibInstance();

    try {
      this.logger.log('📦 Emitindo MDFe (Modelo 58) via ACBrLibMDFe...');

      // Configurar
      await this.configurarParaMdfe(lib, issuer);

      // Limpar lista
      lib.limparLista();

      // Montar XML do MDFe
      const mdfeXML = this.buildMdfeXML(json, issuer);
      this.logger.log(
        `DEBUG MDFe XML (200 chars): ${mdfeXML.substring(0, 200)}`,
      );

      if (lib.carregarXML(mdfeXML) !== 0) {
        throw new Error('Falha ao carregar dados do MDFe');
      }

      // Assinar
      if (lib.assinar() !== 0) {
        throw new Error('Falha ao assinar MDFe');
      }

      // Enviar para SEFAZ
      const enviarResult = lib.enviar(1, false, true, false);
      this.logger.log(`DEBUG enviar MDFe result: ${enviarResult}`);

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
        this.logger.log('🎉 MDFe AUTORIZADO!');

        const chave =
          resultado.Envio?.chDFe ||
          (Object.values(resultado.Envio) as any[]).find(
            (item: any) => item?.chDFe,
          )?.chDFe ||
          '';

        // Gerar PDF DAMDFE
        try {
          lib.imprimirPDF();
          this.logger.log('✅ PDF DAMDFE gerado');
        } catch (pdfError) {
          this.logger.warn('⚠️ Erro ao gerar PDF DAMDFE:', pdfError);
        }

        return {
          success: true,
          protocol: resultado.Envio.NProt,
          accessKey: chave,
          xml: resultado.Envio.XML || '',
          xmlPath: `/app/xml/mdfe/${chave}-mdfe.xml`,
          pdfPath: `/app/pdf/mdfe/${chave}-damdfe.pdf`,
          message: resultado.Envio.XMotivo || 'Autorizado',
        };
      }

      throw new Error(
        `MDFe rejeitado pela SEFAZ (cStat: ${cStat}): ${resultado?.Envio?.XMotivo || 'Erro desconhecido'}`,
      );
    } catch (error) {
      this.logger.error('❌ Erro na emissão MDFe:', error);
      throw error;
    } finally {
      try {
        lib.finalizar();
      } catch {}
    }
  }

  async encerrar(
    accessKey: string,
    ufEncerramento: string,
    issuer: any,
  ): Promise<MdfeEncerrarResult> {
    if (!issuer)
      throw new Error('Contexto do emissor obrigatório para encerramento');

    if (!accessKey || accessKey.length !== 44) {
      throw new Error('Chave de acesso inválida');
    }

    const lib = this.getLibInstance();

    try {
      this.logger.log(`🔒 Encerrando MDFe: ${accessKey} UF: ${ufEncerramento}`);
      await this.configurarParaMdfe(lib, issuer);

      // Encerrar MDF-e (evento 110112)
      const now = new Date();
      const dhEnc = now.toISOString().replace('Z', '-03:00');

      const encerrarResult = lib.encerrar(accessKey, dhEnc, ufEncerramento);

      this.logger.log(`DEBUG encerrar MDFe result: ${encerrarResult}`);

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

      const cStat = response.Encerramento?.CStat || response.CStat;

      if (cStat === 135 || cStat === 132) {
        return {
          success: true,
          protocol: response.Encerramento?.NProt || response.NProt,
          message: 'MDF-e encerrado com sucesso',
          xml: response.Encerramento?.XML || '',
        };
      }

      throw new Error(response.XMotivo || 'Erro ao encerrar MDFe');
    } catch (error) {
      this.logger.error('Erro ao encerrar MDFe:', error);
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
  ): Promise<MdfeCancellationResult> {
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
      this.logger.log(`❌ Cancelando MDFe: ${accessKey}`);
      await this.configurarParaMdfe(lib, issuer);

      const cancelarResult = lib.cancelar(
        accessKey,
        justificativa,
        issuer.cnpj,
        1,
      );

      this.logger.log(`DEBUG cancelar MDFe result: ${cancelarResult}`);

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
          message: 'Cancelamento MDFe homologado',
          xml: response.Cancelamento?.XML || '',
        };
      }

      throw new Error(response.XMotivo || 'Erro ao cancelar MDFe');
    } catch (error) {
      this.logger.error('Erro ao cancelar MDFe:', error);
      throw error;
    } finally {
      try {
        lib.finalizar();
      } catch {}
    }
  }

  /**
   * Monta XML do MDFe (Modelo 58, versão 3.00)
   */
  private buildMdfeXML(json: any, issuer: any): string {
    const now = new Date();
    const dhEmi = now.toISOString().replace('Z', '-03:00');
    const cMDF = Math.floor(Math.random() * 99999999);
    const nMDF = json.numero || 1;
    const serie = json.serie || 1;
    const cnpj = issuer.cnpj.replace(/\D/g, '');

    // Código UF
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
    const ufIni = json.ufIni || issuer.state || 'SP';
    const ufFim = json.ufFim || 'SP';
    const cUF = ufCodes[ufIni] || '35';

    // Documentos vinculados
    const documentos = json.infDoc?.infMunDescarga || [];
    const docElements = documentos
      .map(
        (doc: any) =>
          `<infMunDescarga>
            <cMunDescarga>3550308</cMunDescarga>
            <xMunDescarga>Sao Paulo</xMunDescarga>
            <infNFe><chNFe>${doc.chNFe}</chNFe></infNFe>
          </infMunDescarga>`,
      )
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<MDFe xmlns="http://www.portalfiscal.inf.br/mdfe">
  <infMDFe versao="3.00">
    <ide>
      <cUF>${cUF}</cUF>
      <tpAmb>2</tpAmb>
      <tpEmit>1</tpEmit>
      <tpTransp>1</tpTransp>
      <mod>58</mod>
      <serie>${serie}</serie>
      <nMDF>${nMDF}</nMDF>
      <cMDF>${String(cMDF).padStart(8, '0')}</cMDF>
      <modal>1</modal>
      <dhEmi>${dhEmi}</dhEmi>
      <tpEmis>1</tpEmis>
      <procEmi>0</procEmi>
      <verProc>EngineAPI v2.0</verProc>
      <UFIni>${ufIni}</UFIni>
      <UFFim>${ufFim}</UFFim>
    </ide>
    <emit>
      <CNPJ>${cnpj}</CNPJ>
      <IE>${issuer.ie || ''}</IE>
      <xNome>${issuer.name}</xNome>
      <xFant>${issuer.name}</xFant>
      <enderEmit>
        <xLgr>${issuer.address || 'Rua Teste'}</xLgr>
        <nro>${issuer.number || 'S/N'}</nro>
        <xBairro>${issuer.neighborhood || 'Centro'}</xBairro>
        <cMun>${issuer.ibgeCode || '3550308'}</cMun>
        <xMun>${issuer.city || 'Sao Paulo'}</xMun>
        <CEP>${(issuer.cep || '01000000').replace(/\D/g, '')}</CEP>
        <UF>${issuer.state || 'SP'}</UF>
      </enderEmit>
    </emit>
    <infModal versaoModal="3.00">
      <rodo>
        <infANTT/>
        <veicTracao>
          <placa>${json.veicTracao?.placa || 'ABC1234'}</placa>
          <RNTRC>12345678</RNTRC>
          <tara>${json.veicTracao?.tara || 5000}</tara>
          <capKG>${json.veicTracao?.capKg || 10000}</capKG>
          <condutor>
            <xNome>${json.veicTracao?.condutor?.nome || 'MOTORISTA TESTE'}</xNome>
            <CPF>${(json.veicTracao?.condutor?.cpf || '12345678909').replace(/\D/g, '')}</CPF>
          </condutor>
          <tpRod>02</tpRod>
          <tpCar>00</tpCar>
          <UF>${ufIni}</UF>
        </veicTracao>
      </rodo>
    </infModal>
    <infDoc>
      ${
        docElements ||
        `<infMunDescarga>
        <cMunDescarga>3550308</cMunDescarga>
        <xMunDescarga>Sao Paulo</xMunDescarga>
        <infNFe><chNFe>35240112345678000190550010000000011123456789</chNFe></infNFe>
      </infMunDescarga>`
      }
    </infDoc>
    <tot>
      <qNFe>${json.tot?.qNFe || 1}</qNFe>
      <vCarga>${Number(json.tot?.vCarga || 1000).toFixed(2)}</vCarga>
      <cUnid>01</cUnid>
      <qCarga>${Number(json.tot?.vCarga || 1000).toFixed(4)}</qCarga>
    </tot>
    <infAdic>
      <infCpl>MDFe emitido via EngineAPI</infCpl>
    </infAdic>
  </infMDFe>
</MDFe>`;
  }
}
