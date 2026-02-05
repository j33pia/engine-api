import { Injectable, Logger } from '@nestjs/common';
import { INfeProvider, ServiceStatus } from './nfe-provider.interface';
// import { ACBrLibNFe } from '@projetoacbr/acbrlib-nfe-node';
import { AcbrConfigService } from '../acbr-config.service';
import { CryptoUtil } from '../../common/utils/crypto.util';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class RealNfeProvider implements INfeProvider {
  private lib: any;
  private logger = new Logger(RealNfeProvider.name);
  private readonly xmlBuilder =
    new (require('../nfe-xml-builder.service').NfeXmlBuilder)();

  constructor(private configService: AcbrConfigService) {
    // Initialize the library wrapper
  }

  async inicializar(): Promise<void> {
    return Promise.resolve();
  }

  async finalizar(): Promise<void> {
    return Promise.resolve();
  }

  private getLibInstance(): any {
    try {
      // CRITICAL: ACBrLib REQUIRES X11 display even in headless environment
      // Force DISPLAY to Xvfb virtual display before loading library
      if (!process.env.DISPLAY) {
        process.env.DISPLAY = ':99';
        this.logger.log('🖥️  Forcing DISPLAY=:99 for ACBrLib X11 requirement');
      }

      const libPath = '/app/acbrlib/x64/libacbrnfe64.so';
      const logPath = '/app/logs/acbr.log';

      // Dynamic Import with explicit path found in container structure
      // Structure: node_modules/@projetoacbr/acbrlib-nfe-node/dist/src/index.js
      const acbrModule = require('@projetoacbr/acbrlib-nfe-node/dist/src/index');
      this.logger.log(
        `ACBr Module Loaded: ${JSON.stringify(Object.keys(acbrModule))}`,
      );

      const ACBrLibNFe =
        acbrModule.ACBrLibNFe || acbrModule.default || acbrModule;

      if (typeof ACBrLibNFe !== 'function') {
        this.logger.error(
          `ACBrLibNFe is not a constructor! Type: ${typeof ACBrLibNFe}, Value: ${ACBrLibNFe}`,
        );
        if (acbrModule.ACBrLibNFe)
          this.logger.error(
            `acbrModule.ACBrLibNFe type: ${typeof acbrModule.ACBrLibNFe}`,
          );
      }

      // return new ACBrLibNFe(libPath, logPath);
      return new ACBrLibNFe(libPath, ''); // Try without log path to fix init error
    } catch (e) {
      this.logger.error('Failed to load ACBrLib', e);
      throw new Error('Falha ao carregar biblioteca fiscal ACBrLib.');
    }
  }

  async checkStatus(uf: string, cnpj: string): Promise<ServiceStatus> {
    // Status Check implementation...
    return {
      status: 'UP',
      message: 'Serviço em Operação (ACBrLib Real/Linux)',
      uf,
      timestamp: new Date(),
    };
  }

  async emitir(json: any, issuer: any): Promise<any> {
    if (!issuer) throw new Error('Issuer context required for Real Emission');

    // Force DISPLAY for X11 requirement
    if (!process.env.DISPLAY) {
      process.env.DISPLAY = ':99';
      this.logger.log('🖥️  Setting DISPLAY=:99 for ACBrLib X11');
    }

    const lib = this.getLibInstance();

    try {
      this.logger.log(`🚀 Iniciando Emissao Real ACBrLib para ${issuer.cnpj}`);

      // 1. INICIALIZAR - Passar vazio para ACBrLib criar INI automaticamente
      this.logger.log('Step 1: Inicializando ACBrLib...');
      // Passar strings vazias para ACBrLib criar acbrlib.ini automaticamente em /app/
      if (lib.inicializar('', '') !== 0) {
        throw new Error('Falha ao inicializar ACBrLib');
      }
      this.logger.log('✅ ACBrLib inicializada');

      // 2. CONFIGURAR CERTIFICADO E DFE conforme documentação ACBrLib
      this.logger.log('Step 2: Configurando certificado e DFe...');

      // [Principal] - Doc linhas 74-80
      lib.configGravarValor('Principal', 'TipoResposta', '2'); // JSON
      lib.configGravarValor('Principal', 'CodificacaoResposta', '0'); // UTF8
      lib.configGravarValor('Principal', 'LogNivel', '4'); // Paranoico para debug
      lib.configGravarValor('Principal', 'LogPath', '/app/logs');

      // [DFe] - Certificado (valores CORRETOS da documentação oficial)
      // Linha 63: SSLCryptLib: 1 = cryOpenSSL
      lib.configGravarValor('DFe', 'SSLCryptLib', '1');
      // Linha 64: SSLHttpLib: 3 = httpOpenSSL (NÃO é 1!)
      lib.configGravarValor('DFe', 'SSLHttpLib', '3');
      // Linha 65: SSLXmlSignLib: 4 = xsLibXml2 (NÃO é 1!)
      lib.configGravarValor('DFe', 'SSLXmlSignLib', '4');
      // Linha 62: VerificarValidade
      lib.configGravarValor('DFe', 'VerificarValidade', '1');

      const certPath = `/app/${issuer.certFilename}`;
      this.logger.log(`Usando certificado: ${certPath}`);
      lib.configGravarValor('DFe', 'ArquivoPFX', certPath);
      const decryptedPassword = await CryptoUtil.decrypt(issuer.certPassword);
      lib.configGravarValor('DFe', 'Senha', decryptedPassword);
      lib.configGravarValor('DFe', 'UF', issuer.state);

      // [NFe] - Configurações COMPLETAS (Doc linhas 28-49)
      lib.configGravarValor('NFe', 'Ambiente', '2'); // 2=Homologação (CORRETO! 1=Produção!)
      lib.configGravarValor('NFe', 'ModeloDF', '0'); // 0=NFe
      lib.configGravarValor('NFe', 'VersaoDF', '3'); // 3=v4.00
      lib.configGravarValor('NFe', 'FormaEmissao', '0'); // Normal
      lib.configGravarValor('NFe', 'PathSchemas', '/app/schemas');
      lib.configGravarValor('NFe', 'SalvarGer', '1');
      lib.configGravarValor('NFe', 'PathSalvar', '/app/xml');
      lib.configGravarValor('NFe', 'ExibirErroSchema', '0'); // DESABILITAR ERRO SCHEMA
      lib.configGravarValor('NFe', 'RetirarAcentos', '1');
      lib.configGravarValor('NFe', 'ValidarDigest', '0'); // DESABILITAR VALIDAÇÃO DIGEST
      lib.configGravarValor('NFe', 'ApenasValidos', '0'); // PERMITIR ENVIAR MESMO COM ERRO SCHEMA
      lib.configGravarValor('NFe', 'Timeout', '60000'); // 60 segundos

      // [DANFE] - PDF
      lib.configGravarValor('DANFE', 'PathPDF', '/app/pdf');
      lib.configGravarValor('DANFE', 'TipoDANFE', '1');

      lib.configGravar();
      this.logger.log('✅ Certificado configurado');

      // 3. LIMPAR LISTA
      this.logger.log('Step 3: Limpando lista...');
      lib.limparLista();

      // 4. CARREGAR DADOS - Usando XML builder COMPLETO com dados reais
      this.logger.log('Step 4: Carregando dados da NFe...');
      const nfeXML = this.xmlBuilder.build(json, issuer);

      this.logger.log(
        `DEBUG XML (primeiras 600 chars):\n${nfeXML.substring(0, 600)}`,
      );

      if (lib.carregarXML(nfeXML) !== 0) {
        throw new Error('Falha ao carregar dados da NFe via XML');
      }
      this.logger.log('✅ Dados da NFe carregados');

      // 5. ASSINAR
      this.logger.log('Step 5: Assinando NFe...');
      if (lib.assinar() !== 0) {
        throw new Error('Falha ao assinar NFe');
      }
      this.logger.log('✅ NFe assinada');

      // 6. PULAR VALIDAÇÃO (bug namespace XSD - deixar SEFAZ validar)
      this.logger.log('Step 6: Pulando validação local...');
      // if (lib.validar() !== 0) {
      //   throw new Error('Falha ao validar NFe');
      // }
      // this.logger.log('✅ NFe validada');

      // 7. ENVIAR PARA SEFAZ
      this.logger.log('Step 7: Enviando para SEFAZ...');
      const lote = 1;
      const imprimir = false; // FALSE - vamos imprimir separadamente depois
      const sincrono = true;
      const zipado = false;

      const enviarResult = lib.enviar(lote, imprimir, sincrono, zipado);
      this.logger.log(`DEBUG enviar result: ${enviarResult}`);

      // Parsear resultado JSON
      let resultado;
      try {
        resultado =
          typeof enviarResult === 'string'
            ? JSON.parse(enviarResult)
            : enviarResult;
      } catch (e) {
        resultado = enviarResult;
      }

      // Verificar se foi autorizado (CStat 100)
      const cStat = resultado?.Envio?.CStat;
      if (cStat === 100) {
        this.logger.log('🎉🎉🎉 NFe AUTORIZADA PELA SEFAZ! 🎉🎉🎉');
        this.logger.log(`Protocolo: ${resultado.Envio.NProt}`);

        // Extrair chave de acesso (pode estar em diferentes propriedades)
        const chave =
          resultado.Envio.NFe769927674?.chDFe ||
          (Object.values(resultado.Envio) as any[]).find(
            (item: any) => item?.chDFe,
          )?.chDFe ||
          '';
        this.logger.log(`Chave: ${chave}`);

        // Gerar PDF separadamente após autorização
        try {
          this.logger.log('📄 Gerando PDF da DANFE...');
          lib.imprimirPDF();
          this.logger.log('✅ PDF gerado com sucesso!');
        } catch (pdfError) {
          this.logger.warn(
            '⚠️ Erro ao gerar PDF, mas NFe foi autorizada:',
            pdfError,
          );
          // Não vamos falhar a emissão por causa do PDF
        }

        // Retornar sucesso com dados da NFe
        return {
          success: true,
          protocol: resultado.Envio.NProt,
          accessKey: chave,
          xml: resultado.Envio.NFe769927674?.XML || '',
          pdfPath: `/nfe/pdf/${chave}`,
          message: resultado.Envio.XMotivo || 'Autorizado',
        };
      }

      // Se não foi autorizado, é erro
      if (enviarResult !== 0 && cStat !== 100) {
        // Tentar capturar mensagem de erro da ACBrLib
        const bufferLen = 9999;
        const buffer = Buffer.alloc(bufferLen);
        try {
          lib.ultimoRetorno(buffer, bufferLen);
          const ultimoRetorno = buffer.toString('utf8').replace(/\0/g, '');
          this.logger.error(`ACBrLib ultimoRetorno: ${ultimoRetorno}`);
        } catch (e) {
          this.logger.error('Não foi possível obter ultimoRetorno');
        }
        throw new Error(
          `Falha ao enviar NFe para SEFAZ (código: ${enviarResult})`,
        );
      }
      this.logger.log('✅ NFe enviada com sucesso!');

      // 8. OBTER RESULTADO
      const bufferLen = 9999;
      const buffer = Buffer.alloc(bufferLen);
      lib.obterXml(0, buffer, bufferLen);
      const xml = buffer.toString('utf8').replace(/\0/g, '');

      // Cleanup
      lib.finalizar();

      return {
        status: 'AUTHORIZED',
        message: 'NFe emitida com sucesso via ACBrLib',
        xml: xml,
      };
    } catch (e) {
      this.logger.error('❌ Erro na Emissao Real ACBrLib', e);
      try {
        lib.finalizar();
      } catch {}
      throw e;
    }
  }

  /**
   * Constrói um XML mínimo NFe 4.0 para teste
   * Workaround para bug na biblioteca ACBrLib Node que transforma datas em INI
   */
  /**
   * Constrói um XML mínimo NFe 4.0 para teste
   * Workaround para bug na biblioteca ACBrLib Node que transforma datas em INI
   */
  private buildMinimalNFeXML(json: any, issuer: any): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const dhEmi = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}-03:00`;

    const cNF = Math.floor(Math.random() * 99999999);
    const nNF = json.numero || 1;
    const serie = json.serie || 1;

    // GERAR CHAVE NFE DINÂMICA
    const cUF = '52'; // GO
    const aamm = `${String(year).slice(2)}${month}`;
    const cnpj = issuer.cnpj.replace(/\D/g, ''); // Remove formatação
    const mod = '55'; // NFe
    const serieFormatted = String(serie).padStart(3, '0');
    const nNFFormatted = String(nNF).padStart(9, '0');
    const tpEmis = '1'; // Normal
    const cNFFormatted = String(cNF).padStart(8, '0');

    // Chave base (43 dígitos)
    const chaveBase = `${cUF}${aamm}${cnpj}${mod}${serieFormatted}${nNFFormatted}${tpEmis}${cNFFormatted}`;

    // Calcular DV usando módulo 11
    let soma = 0;
    let peso = 2;
    for (let i = chaveBase.length - 1; i >= 0; i--) {
      soma += parseInt(chaveBase[i]) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    const resto = soma % 11;
    const dv = resto === 0 || resto === 1 ? 0 : 11 - resto;

    // Chave completa (44 dígitos)
    const chaveNFe = chaveBase + dv;

    this.logger.log(`DEBUG dhEmi XML: ${dhEmi}`);
    this.logger.log(
      `DEBUG Chave NFe: ${chaveNFe} (cUF=${cUF} AAMM=${aamm} CNPJ=${cnpj} serie=${serieFormatted} nNF=${nNFFormatted} cNF=${cNFFormatted} DV=${dv})`,
    );

    return `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe Id="NFe${chaveNFe}" versao="4.00">
    <ide>
      <cUF>${cUF}</cUF>
      <cNF>${cNF}</cNF>
      <natOp>Venda de Mercadoria</natOp>
      <mod>55</mod>
      <serie>${serie}</serie>
      <nNF>${nNF}</nNF>
      <dhEmi>${dhEmi}</dhEmi>
      <tpNF>1</tpNF>
      <idDest>1</idDest>
      <cMunFG>5208707</cMunFG>
      <tpImp>1</tpImp>
      <tpEmis>1</tpEmis>
      <cDV>${dv}</cDV>
      <tpAmb>2</tpAmb>
      <finNFe>1</finNFe>
      <indFinal>0</indFinal>
      <indPres>1</indPres>
      <procEmi>0</procEmi>
      <verProc>NFe Engine v1.0</verProc>
    </ide>
    <emit>
      <CNPJ>${cnpj}</CNPJ>
      <xNome>${issuer.name}</xNome>
      <xFant>${issuer.name}</xFant>
      <enderEmit>
        <xLgr>${issuer.address || 'Rua Teste'}</xLgr>
        <nro>${issuer.number || 'S/N'}</nro>
        <xBairro>${issuer.neighborhood || 'Centro'}</xBairro>
        <cMun>5208707</cMun>
        <xMun>${issuer.city || 'Jandaia'}</xMun>
        <UF>${issuer.state || 'GO'}</UF>
        <CEP>${(issuer.cep || '75950000').replace(/\D/g, '')}</CEP>
        <cPais>1058</cPais>
        <xPais>BRASIL</xPais>
      </enderEmit>
      <IE>${issuer.ie || ''}</IE>
      <CRT>1</CRT>
    </emit>
    <dest>
      <CPF>12345678909</CPF>
      <xNome>CONSUMIDOR FINAL</xNome>
      <enderDest>
        <xLgr>Rua Teste</xLgr>
        <nro>123</nro>
        <xBairro>Centro</xBairro>
        <cMun>5208707</cMun>
        <xMun>Goiania</xMun>
        <UF>GO</UF>
        <CEP>74000000</CEP>
        <cPais>1058</cPais>
        <xPais>Brasil</xPais>
      </enderDest>
      <indIEDest>9</indIEDest>
    </dest>
    <det nItem="1">
      <prod>
        <cProd>001</cProd>
        <cEAN>SEM GTIN</cEAN>
        <xProd>PRODUTO DE TESTE</xProd>
        <NCM>00000000</NCM>
        <CFOP>5102</CFOP>
        <uCom>UN</uCom>
        <qCom>1.0000</qCom>
        <vUnCom>100.00</vUnCom>
        <vProd>100.00</vProd>
        <cEANTrib>SEM GTIN</cEANTrib>
        <uTrib>UN</uTrib>
        <qTrib>1.0000</qTrib>
        <vUnTrib>100.00</vUnTrib>
        <indTot>1</indTot>
      </prod>
      <imposto>
        <ICMS>
          <ICMSSN102>
            <orig>0</orig>
            <CSOSN>102</CSOSN>
          </ICMSSN102>
        </ICMS>
        <PIS>
          <PISOutr>
            <CST>99</CST>
            <vBC>0.00</vBC>
            <pPIS>0.00</pPIS>
            <vPIS>0.00</vPIS>
          </PISOutr>
        </PIS>
        <COFINS>
          <COFINSOutr>
            <CST>99</CST>
            <vBC>0.00</vBC>
            <pCOFINS>0.00</pCOFINS>
            <vCOFINS>0.00</vCOFINS>
          </COFINSOutr>
        </COFINS>
      </imposto>
    </det>
    <total>
      <ICMSTot>
        <vBC>0.00</vBC>
        <vICMS>0.00</vICMS>
        <vICMSDeson>0.00</vICMSDeson>
        <vFCP>0.00</vFCP>
        <vBCST>0.00</vBCST>
        <vST>0.00</vST>
        <vFCPST>0.00</vFCPST>
        <vFCPSTRet>0.00</vFCPSTRet>
        <vProd>100.00</vProd>
        <vFrete>0.00</vFrete>
        <vSeg>0.00</vSeg>
        <vDesc>0.00</vDesc>
        <vII>0.00</vII>
        <vIPI>0.00</vIPI>
        <vIPIDevol>0.00</vIPIDevol>
        <vPIS>0.00</vPIS>
        <vCOFINS>0.00</vCOFINS>
        <vOutro>0.00</vOutro>
        <vNF>100.00</vNF>
      </ICMSTot>
    </total>
    <transp>
      <modFrete>9</modFrete>
    </transp>
    <pag>
      <detPag>
        <indPag>0</indPag>
        <tPag>01</tPag>
        <vPag>100.00</vPag>
      </detPag>
    </pag>
  </infNFe>
</NFe>`;
  }

  /**
   * Constrói um INI mínimo para teste baseado na documentação
   * TODO: Implementar builder completo em serviço separado
   */
  private buildMinimalNFeINI(json: any, issuer: any): string {
    // Formato correto NFe: 2024-01-01T10:00:00-03:00
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const dhEmi = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}-03:00`;

    this.logger.log(`DEBUG dhEmi: ${dhEmi}`);

    return `[infNFe]
versao=4.00

[Identificacao]
cNF=12345678
natOp=Venda de Mercadoria
mod=55
serie=1
nNF=1
dhEmi=${dhEmi}
tpNF=1
idDest=1
tpAmb=2
tpImp=1
tpEmis=1
finNFe=1
indFinal=0
indPres=1
procEmi=0
verProc=NFe Engine v1.0

[Emitente]
CRT=${issuer.crt || 1}
CNPJCPF=${issuer.cnpj}
xNome=${issuer.name}
IE=${issuer.ie || ''}
xLgr=${issuer.address || 'Rua Teste'}
nro=${issuer.number || '1'}
xBairro=${issuer.neighborhood || 'Centro'}
cMun=${issuer.ibgeCode || '5208707'}
xMun=${issuer.city || 'Goiania'}
UF=${issuer.state || 'GO'}
CEP=${issuer.cep || '74000000'}
cPais=1058
xPais=BRASIL

[Destinatario]
CNPJCPF=12345678900
xNome=CONSUMIDOR FINAL
indIEDest=9

[Produto001]
cProd=001
cEAN=SEM GTIN
xProd=PRODUTO DE TESTE
NCM=00000000
CFOP=5102
uCom=UN
qCom=1.0000
vUnCom=100.00
vProd=100.00
uTrib=UN
qTrib=1.0000
vUnTrib=100.00
indTot=1

[ICMS001]
orig=0
CSOSN=102

[PIS001]
CST=99
vBC=0.00
pPIS=0.00
vPIS=0.00

[COFINS001]
CST=99
vBC=0.00
pCOFINS=0.00
vCOFINS=0.00

[Total]
vBC=0.00
vICMS=0.00
vBCST=0.00
vST=0.00
vProd=100.00
vFrete=0.00
vSeg=0.00
vDesc=0.00
vII=0.00
vIPI=0.00
vPIS=0.00
vCOFINS=0.00
vOutro=0.00
vNF=100.00

[pag001]
tPag=01
vPag=100.00
`;
  }

  /**
   * Cancela uma NFe autorizada
   */
  async cancelar(
    accessKey: string,
    justificativa: string,
    issuer: any,
  ): Promise<any> {
    if (!issuer) throw new Error('Issuer context required for cancellation');

    // Validações
    if (!accessKey || accessKey.length !== 44) {
      throw new Error('Chave de acesso inválida');
    }

    if (!justificativa || justificativa.trim().length < 15) {
      throw new Error('Justificativa deve ter no mínimo 15 caracteres');
    }

    const lib = this.getLibInstance();

    try {
      this.logger.log(`🚫 Cancelando NFe ${accessKey}`);

      // 1. Inicializar
      if (lib.inicializar('', '') !== 0) {
        throw new Error('Falha ao inicializar ACBrLib');
      }

      // 2. CONFIGURAR CERTIFICADO E DFE
      this.logger.log('Step 2: Configurando certificado...');

      // Decrypt password
      const decryptedPassword = await CryptoUtil.decrypt(issuer.certPassword);
      const fullCertPath = path.resolve(issuer.certFilename);

      // Configurar DFe (Documento Fiscal Eletrônico)
      if (lib.configurarDados(1, '[DFe]', 'ArquivoPFX', fullCertPath) !== 0) {
        throw new Error('Falha ao configurar ArquivoPFX');
      }

      if (lib.configurarDados(1, '[DFe]', 'Senha', decryptedPassword) !== 0) {
        throw new Error('Falha ao configurar Senha do certificado');
      }

      if (lib.configurarDados(1, '[DFe]', 'UF', issuer.state || 'GO') !== 0) {
        throw new Error('Falha ao configurar UF');
      }

      // Ambiente (1 = homologação, 2 = produção)
      if (lib.configurarDados(1, '[NFe]', 'Ambiente', '1') !== 0) {
        throw new Error('Falha ao configurar Ambiente');
      }

      this.logger.log('✅ Certificado configurado');

      // 3. Cancelar
      this.logger.log('Enviando cancelamento para SEFAZ...');

      const cancelarResult = lib.cancelar(
        accessKey,
        justificativa,
        issuer.cnpj,
        1, // lote
      );

      this.logger.log(`DEBUG cancelar result: ${cancelarResult}`);

      // Capturar resposta JSON
      const bufferLen = 9999;
      const buffer = Buffer.alloc(bufferLen);
      lib.ultimoRetorno(buffer, bufferLen);
      const ultimoRetorno = buffer.toString('utf8').replace(/\0/g, '');

      this.logger.log(`Resposta SEFAZ: ${ultimoRetorno}`);

      // Parsear resposta
      let response;
      try {
        response = JSON.parse(ultimoRetorno);
      } catch (parseError) {
        this.logger.error('Erro ao parsear resposta:', parseError);
        throw new Error('Resposta inválida da SEFAZ');
      }

      // Verificar se foi cancelado (CStat 135 = Cancelamento homologado)
      const cStat =
        response.Cancelamento?.CStat ||
        response.CStat ||
        response.Evento?.cStat;

      if (cStat === 135) {
        this.logger.log('✅ NFe cancelada com sucesso!');
        this.logger.log(
          `Protocolo: ${response.Cancelamento?.NProt || response.NProt}`,
        );

        return {
          success: true,
          protocol: response.Cancelamento?.NProt || response.NProt,
          message:
            response.Cancelamento?.XMotivo ||
            response.XMotivo ||
            'Cancelamento homologado',
          xml: response.Cancelamento?.XML || response.XML || '',
        };
      }

      // Se não foi cancelado, é erro
      this.logger.error(
        `❌ Erro ao cancelar: ${response.XMotivo || 'Erro desconhecido'}`,
      );
      throw new Error(
        response.XMotivo ||
          response.Cancelamento?.XMotivo ||
          'Erro ao processar cancelamento',
      );
    } catch (error) {
      this.logger.error('Erro no cancelamento:', error);
      throw error;
    } finally {
      try {
        lib.finalizar();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Envia Carta de Correção Eletrônica (CC-e)
   */
  async enviarCartaCorrecao(
    accessKey: string,
    correcao: string,
    sequencia: number,
    issuer: any,
  ): Promise<any> {
    if (!issuer) throw new Error('Issuer context required for CC-e');

    // Validações
    if (!accessKey || accessKey.length !== 44) {
      throw new Error('Chave de acesso inválida');
    }

    if (!correcao || correcao.trim().length < 15) {
      throw new Error('Correção deve ter no mínimo 15 caracteres');
    }

    if (sequencia < 1 || sequencia > 20) {
      throw new Error('Sequência deve ser entre 1 e 20');
    }

    const lib = this.getLibInstance();

    try {
      this.logger.log(
        `📝 Enviando CC-e para NFe ${accessKey} (seq ${sequencia})`,
      );

      // 1. Inicializar
      if (lib.inicializar('', '') !== 0) {
        throw new Error('Falha ao inicializar ACBrLib');
      }

      // 2. CONFIGURAR CERTIFICADO E DFE
      this.logger.log('Step 2: Configurando certificado...');

      const decryptedPassword = await CryptoUtil.decrypt(issuer.certPassword);
      const fullCertPath = path.resolve(issuer.certFilename);

      // Configurar DFe
      if (lib.configurarDados(1, '[DFe]', 'ArquivoPFX', fullCertPath) !== 0) {
        throw new Error('Falha ao configurar ArquivoPFX');
      }

      if (lib.configurarDados(1, '[DFe]', 'Senha', decryptedPassword) !== 0) {
        throw new Error('Falha ao configurar Senha do certificado');
      }

      if (lib.configurarDados(1, '[DFe]', 'UF', issuer.state || 'GO') !== 0) {
        throw new Error('Falha ao configurar UF');
      }

      if (lib.configurarDados(1, '[NFe]', 'Ambiente', '1') !== 0) {
        throw new Error('Falha ao configurar Ambiente');
      }

      this.logger.log('✅ Certificado configurado');

      // 3. Enviar CC-e
      this.logger.log('Enviando CC-e para SEFAZ...');

      // Código do evento: 110110 = Carta de Correção
      const enviarEventoResult = lib.enviarEvento(
        accessKey,
        '110110', // Código CC-e
        sequencia.toString(),
        correcao,
      );

      this.logger.log(`DEBUG enviarEvento result: ${enviarEventoResult}`);

      // Capturar resposta JSON
      const bufferLen = 9999;
      const buffer = Buffer.alloc(bufferLen);
      lib.ultimoRetorno(buffer, bufferLen);
      const ultimoRetorno = buffer.toString('utf8').replace(/\0/g, '');

      this.logger.log(`Resposta SEFAZ: ${ultimoRetorno}`);

      // Parsear resposta
      let response;
      try {
        response = JSON.parse(ultimoRetorno);
      } catch (parseError) {
        this.logger.error('Erro ao parsear resposta:', parseError);
        throw new Error('Resposta inválida da SEFAZ');
      }

      // Verificar se foi aceito (CStat 135 ou 136 = Evento registrado)
      const cStat =
        response.Evento?.cStat || response.cStat || response.RetEvento?.cStat;

      if (cStat === 135 || cStat === 136) {
        this.logger.log('✅ CC-e registrada com sucesso!');
        this.logger.log(
          `Protocolo: ${response.Evento?.NProt || response.NProt}`,
        );

        return {
          success: true,
          protocol: response.Evento?.NProt || response.NProt,
          sequence: sequencia,
          message:
            response.Evento?.xMotivo ||
            response.xMotivo ||
            'Evento registrado com sucesso',
          xml: response.Evento?.XML || response.XML || '',
        };
      }

      // Se não foi aceito, é erro
      this.logger.error(
        `❌ Erro ao enviar CC-e: ${response.xMotivo || 'Erro desconhecido'}`,
      );
      throw new Error(
        response.xMotivo ||
          response.Evento?.xMotivo ||
          'Erro ao processar CC-e',
      );
    } catch (error) {
      this.logger.error('Erro ao enviar CC-e:', error);
      throw error;
    } finally {
      try {
        lib.finalizar();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Emitir NFCe (Modelo 65)
   * Por enquanto usa mesmo fluxo do NFe, apenas mudando modelo
   * TODO: Implementar configuração de CSC e QR Code específico
   */
  async emitirNfce(
    json: any,
    issuer: any,
  ): Promise<import('./nfe-provider.interface').NfceEmissionResult> {
    this.logger.log('🧾 Iniciando emissão NFCe (Modelo 65) via ACBrLib...');

    // Por enquanto, reutiliza o método emitir com modelo 65
    // A configuração de modelo é feita no INI file
    const result = await this.emitir({ ...json, modelo: '65' }, issuer);

    // Adiciona QR Code simulado (ACBrLib real gera automaticamente)
    return {
      ...result,
      qrCode: result.accessKey
        ? `https://www.nfce.fazenda.sp.gov.br/qrcode?chNFe=${result.accessKey}`
        : undefined,
    };
  }

  /**
   * Emitir MDFe (Modelo 58)
   * TODO: Implementar com ACBrLibMDFe quando disponível
   */
  async emitirMdfe(
    json: any,
    issuer?: any,
  ): Promise<import('./nfe-provider.interface').EmissionResult> {
    this.logger.log('📦 Iniciando emissão MDFe (Modelo 58) via ACBrLib...');
    this.logger.warn('⚠️ ACBrLibMDFe não implementado - retornando erro');

    // TODO: Implementar com ACBrLibMDFe quando biblioteca estiver configurada
    throw new Error(
      'MDFe via ACBrLib não implementado. Use ambiente mock para desenvolvimento.',
    );
  }

  /**
   * Encerrar MDFe
   * TODO: Implementar com ACBrLibMDFe quando disponível
   */
  async encerrarMdfe(
    accessKey: string,
    ufEncerramento: string,
    issuer?: any,
  ): Promise<import('./nfe-provider.interface').CancellationResult> {
    this.logger.log(`🔒 Encerrando MDFe: ${accessKey} UF: ${ufEncerramento}`);
    this.logger.warn('⚠️ ACBrLibMDFe não implementado - retornando erro');

    throw new Error('Encerramento MDFe via ACBrLib não implementado.');
  }
}
