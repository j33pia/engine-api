export interface NfseProvider {
  /**
   * Configura o município para emissão
   */
  configurarMunicipio(
    codigoIBGE: string,
    certPath: string,
    certPassword: string,
  ): Promise<void>;

  /**
   * Emite uma NFSe
   */
  emitir(nfseData: any): Promise<{
    success: boolean;
    numero?: string;
    codigoVerificacao?: string;
    dataEmissao?: Date;
    xmlContent?: string;
    protocolo?: string;
    error?: string;
  }>;

  /**
   * Cancela uma NFSe
   */
  cancelar(
    numero: string,
    codigoVerificacao: string,
    motivo: string,
  ): Promise<{
    success: boolean;
    protocolo?: string;
    error?: string;
  }>;

  /**
   * Consulta status de uma NFSe
   */
  consultar(numero: string): Promise<{
    success: boolean;
    status?: string;
    xmlContent?: string;
    error?: string;
  }>;

  /**
   * Gera PDF da NFSe
   */
  gerarPdf(xmlContent: string): Promise<Buffer | string>;
}

export const NFSE_PROVIDER = 'NFSE_PROVIDER';
