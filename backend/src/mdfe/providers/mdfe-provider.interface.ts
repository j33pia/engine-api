/**
 * Interface do Provider MDF-e (Modelo 58)
 *
 * Define o contrato para emissão, encerramento e cancelamento
 * de Manifestos Eletrônicos de Documentos Fiscais.
 *
 * MDF-e utiliza uma biblioteca ACBr separada (libacbrmdfe64.so),
 * diferente da NFe/NFC-e.
 */

export interface MdfeServiceStatus {
  status: 'UP' | 'DOWN' | 'MAINTENANCE';
  message: string;
  uf: string;
  timestamp: Date;
}

export interface MdfeEmissionResult {
  success: boolean;
  accessKey?: string;
  protocol?: string;
  xml?: string;
  xmlPath?: string;
  pdfPath?: string;
  message?: string;
}

export interface MdfeEncerrarResult {
  success: boolean;
  protocol?: string;
  message?: string;
  xml?: string;
}

export interface MdfeCancellationResult {
  success: boolean;
  protocol?: string;
  message?: string;
  xml?: string;
}

export interface IMdfeProvider {
  /** Inicializar a biblioteca ACBrMDFe */
  inicializar(): Promise<void>;

  /** Finalizar e liberar recursos */
  finalizar(): Promise<void>;

  /** Verificar status do serviço na SEFAZ */
  checkStatus(uf: string, cnpj: string): Promise<MdfeServiceStatus>;

  /** Emitir MDFe (Modelo 58) */
  emitir(json: any, issuer?: any): Promise<MdfeEmissionResult>;

  /** Encerrar MDFe autorizado */
  encerrar(
    accessKey: string,
    ufEncerramento: string,
    issuer: any,
  ): Promise<MdfeEncerrarResult>;

  /** Cancelar MDFe autorizado */
  cancelar(
    accessKey: string,
    justificativa: string,
    issuer: any,
  ): Promise<MdfeCancellationResult>;
}
