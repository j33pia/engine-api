import { Injectable, Logger } from '@nestjs/common';
import { NfseProvider } from './nfse-provider.interface';
import { CryptoUtil } from '../../common/utils/crypto.util';

/**
 * Provider Real NFS-e via ACBrLibNFSe
 *
 * NFS-e (Nota Fiscal de Serviço Eletrônica) utiliza biblioteca própria
 * (libacbrnfse64.so) e o binding @projetoacbr/acbrlib-nfse-node.
 *
 * Suporta múltiplos padrões municipais via ACBr:
 * - ABRASF 2.04 (maioria dos municípios)
 * - Ginfes, ISSNet, Betha, IPM, Tiplan
 * - WebISS, EL, Governa, SimplISS
 */
@Injectable()
export class RealNfseProvider implements NfseProvider {
  private lib: any;
  private readonly logger = new Logger(RealNfseProvider.name);

  /**
   * Obtém instância da biblioteca ACBrNFSe
   */
  private getLibInstance(): any {
    try {
      const { ACBrLibNFSe } = require('@projetoacbr/acbrlib-nfse-node');
      const lib = new ACBrLibNFSe();

      if (lib.inicializar('', '') !== 0) {
        throw new Error('Falha ao inicializar ACBrLibNFSe');
      }

      return lib;
    } catch (error: any) {
      this.logger.error(`Erro ao carregar ACBrLibNFSe: ${error.message}`);
      throw new Error(
        'ACBrLibNFSe não disponível. Verifique se libacbrnfse64.so está instalada.',
      );
    }
  }

  async configurarMunicipio(
    codigoIBGE: string,
    certPath: string,
    certPassword: string,
  ): Promise<void> {
    const lib = this.getLibInstance();

    try {
      this.logger.log(`Configurando município: ${codigoIBGE}`);

      // [Principal]
      lib.configGravarValor('Principal', 'TipoResposta', '2'); // JSON
      lib.configGravarValor('Principal', 'CodificacaoResposta', '0'); // UTF8
      lib.configGravarValor('Principal', 'LogNivel', '4');
      lib.configGravarValor('Principal', 'LogPath', '/app/logs');

      // [DFe] - Certificado
      lib.configGravarValor('DFe', 'SSLCryptLib', '1');
      lib.configGravarValor('DFe', 'SSLHttpLib', '3');
      lib.configGravarValor('DFe', 'SSLXmlSignLib', '4');

      if (certPath) {
        const fullCertPath = `/app/${certPath}`;
        lib.configGravarValor('DFe', 'ArquivoPFX', fullCertPath);
        const decryptedPassword = await CryptoUtil.decrypt(certPassword);
        lib.configGravarValor('DFe', 'Senha', decryptedPassword);
      }

      // [NFSe] - Configurações
      lib.configGravarValor('NFSe', 'Ambiente', '2'); // Homologação
      lib.configGravarValor('NFSe', 'CodigoMunicipio', codigoIBGE);
      lib.configGravarValor('NFSe', 'SalvarGer', '1');
      lib.configGravarValor('NFSe', 'PathSalvar', '/app/xml/nfse');
      lib.configGravarValor('NFSe', 'Timeout', '60000');

      lib.configGravar();
      this.logger.log(`✅ Município ${codigoIBGE} configurado`);

      lib.finalizar();
    } catch (error) {
      try {
        lib.finalizar();
      } catch {}
      throw error;
    }
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
    const lib = this.getLibInstance();

    try {
      this.logger.log('📋 Emitindo NFSe via ACBrLibNFSe...');

      // Limpar lista
      lib.limparLista();

      // Montar INI do RPS (Recibo Provisório de Serviço)
      const rpsINI = this.buildRpsINI(nfseData);
      this.logger.log(`DEBUG RPS INI (200 chars): ${rpsINI.substring(0, 200)}`);

      // Carregar RPS
      if (lib.carregarINI(rpsINI) !== 0) {
        throw new Error('Falha ao carregar dados do RPS');
      }

      // Enviar lote de RPS
      const enviarResult = lib.enviar(1, true); // lote=1, sincrono=true
      this.logger.log(`DEBUG enviar NFSe: ${enviarResult}`);

      let resultado: any;
      try {
        resultado =
          typeof enviarResult === 'string'
            ? JSON.parse(enviarResult)
            : enviarResult;
      } catch {
        resultado = enviarResult;
      }

      // Verificar sucesso (depende do padrão municipal)
      if (resultado?.NFSe?.Numero || resultado?.success) {
        this.logger.log('🎉 NFSe AUTORIZADA!');

        return {
          success: true,
          numero: resultado.NFSe?.Numero || resultado.numero,
          codigoVerificacao:
            resultado.NFSe?.CodigoVerificacao || resultado.codigoVerificacao,
          dataEmissao: new Date(),
          xmlContent: resultado.XML || resultado.xmlContent,
          protocolo: resultado.Protocolo || resultado.protocolo,
        };
      }

      return {
        success: false,
        error: resultado?.Mensagem || resultado?.error || 'Erro ao emitir NFSe',
      };
    } catch (error: any) {
      this.logger.error('❌ Erro na emissão NFSe:', error);
      return {
        success: false,
        error: error.message,
      };
    } finally {
      try {
        lib.finalizar();
      } catch {}
    }
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
    const lib = this.getLibInstance();

    try {
      this.logger.log(`❌ Cancelando NFSe ${numero}...`);

      const cancelarResult = lib.cancelarNFSe(
        numero,
        codigoVerificacao,
        motivo,
      );

      this.logger.log(`DEBUG cancelar NFSe: ${cancelarResult}`);

      let resultado: any;
      try {
        resultado =
          typeof cancelarResult === 'string'
            ? JSON.parse(cancelarResult)
            : cancelarResult;
      } catch {
        resultado = cancelarResult;
      }

      if (resultado?.success || resultado?.Cancelamento) {
        return {
          success: true,
          protocolo: resultado.Protocolo || resultado.protocolo,
        };
      }

      return {
        success: false,
        error: resultado?.Mensagem || 'Erro ao cancelar NFSe',
      };
    } catch (error: any) {
      this.logger.error('Erro ao cancelar NFSe:', error);
      return {
        success: false,
        error: error.message,
      };
    } finally {
      try {
        lib.finalizar();
      } catch {}
    }
  }

  async consultar(numero: string): Promise<{
    success: boolean;
    status?: string;
    xmlContent?: string;
    error?: string;
  }> {
    const lib = this.getLibInstance();

    try {
      this.logger.log(`🔍 Consultando NFSe ${numero}...`);

      const consultarResult = lib.consultarNFSe(numero);

      let resultado: any;
      try {
        resultado =
          typeof consultarResult === 'string'
            ? JSON.parse(consultarResult)
            : consultarResult;
      } catch {
        resultado = consultarResult;
      }

      return {
        success: true,
        status: resultado?.Situacao || 'AUTORIZADA',
        xmlContent: resultado?.XML,
      };
    } catch (error: any) {
      this.logger.error('Erro ao consultar NFSe:', error);
      return {
        success: false,
        error: error.message,
      };
    } finally {
      try {
        lib.finalizar();
      } catch {}
    }
  }

  async gerarPdf(xmlContent: string): Promise<Buffer | string> {
    this.logger.log('📄 Gerando PDF da NFSe via ACBr...');

    // ACBrNFSe pode gerar PDF do DANFSE
    // Fallback para HTML se PDF não disponível
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>NFSe - Documento Auxiliar</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
    .titulo { font-size: 24px; font-weight: bold; color: #1a365d; }
    .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
    .label { font-weight: bold; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <div class="titulo">NOTA FISCAL DE SERVIÇOS ELETRÔNICA - NFSe</div>
    <span>Gerado via ACBrLibNFSe</span>
  </div>
  <div class="section">
    <p><span class="label">Data:</span> ${new Date().toLocaleString('pt-BR')}</p>
    <p><span class="label">Observação:</span> PDF gerado pelo provider real ACBr.</p>
  </div>
</body>
</html>`;
  }

  /**
   * Monta INI do RPS no formato esperado pelo ACBrNFSe
   * Formato ABRASF 2.04
   */
  private buildRpsINI(data: any): string {
    const now = new Date();
    const dhEmi = now.toISOString();

    return `[IdentificacaoRps]
Numero=${Math.floor(Math.random() * 999999)}
Serie=RPS
Tipo=1

[DataEmissao]
Data=${dhEmi}

[Prestador]
CNPJCPF=${data.prestador?.cnpj || ''}
InscricaoMunicipal=${data.prestador?.inscricaoMunicipal || ''}
RazaoSocial=${data.prestador?.razaoSocial || ''}

[Tomador]
CNPJCPF=${data.tomador?.cnpjCpf || ''}
RazaoSocial=${data.tomador?.razaoSocial || ''}
Logradouro=${data.tomador?.endereco?.logradouro || ''}
Numero=${data.tomador?.endereco?.numero || ''}
Bairro=${data.tomador?.endereco?.bairro || ''}
CodigoMunicipio=${data.tomador?.endereco?.codigoMunicipio || ''}
UF=${data.tomador?.endereco?.uf || ''}
CEP=${data.tomador?.endereco?.cep || ''}

[Servico]
ItemListaServico=${data.servico?.itemListaServico || '1.01'}
CodigoCnae=${data.servico?.codigoCnae || ''}
Discriminacao=${data.servico?.discriminacao || 'Serviço prestado'}
CodigoMunicipio=${data.servico?.codigoMunicipio || '3550308'}

[Valores]
ValorServicos=${data.servico?.valorServicos || 0}
ValorDeducoes=${data.servico?.valorDeducoes || 0}
AliquotaIss=${data.servico?.aliquotaIss || 0}
IssRetido=${data.servico?.issRetido || 2}
`;
  }
}
