import { Injectable } from '@nestjs/common';
import { Issuer } from '@prisma/client';
import { CryptoUtil } from '../common/utils/crypto.util';
import * as path from 'path';

@Injectable()
export class AcbrConfigService {
  /**
   * Gera o conteúdo do arquivo acbrlib.ini para um emissor específico.
   * ATENÇÃO: A ACBrLib é EXTREMAMENTE sensível a formatação do INI.
   * NÃO use aspas, NÃO deixe espaços extras, NÃO adicione comentários inline.
   */
  async generateConfig(issuer: Issuer): Promise<string> {
    if (!issuer.certFilename || !issuer.certPassword) {
      throw new Error('Emissor sem certificado digital configurado.');
    }

    const decryptedPassword = await CryptoUtil.decrypt(issuer.certPassword);
    const fullCertPath = path.resolve(issuer.certFilename);

    // INI simplificado - apenas campos obrigatórios
    const config = `[Principal]
TipoResposta=2
LogNivel=4
LogPath=/app/logs

[NFe]
FormaEmissao=0
ModeloDF=55
VersaoDF=4.00
SalvarGer=1
PathNFe=/app/xml/nfe

[DFe]
ArquivoPFX=${fullCertPath}
Senha=${decryptedPassword}
UF=${issuer.state}
SSLLib=4
CryptLib=1
HttpLib=2
XmlSignLib=4

[DANFE]
PathPDF=/app/xml/pdf`;

    return config;
  }
}
