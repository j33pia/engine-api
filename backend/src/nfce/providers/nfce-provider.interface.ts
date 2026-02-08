/**
 * Interface do Provider NFC-e (Modelo 65)
 *
 * Define o contrato para emissão, cancelamento e inutilização
 * de Notas Fiscais de Consumidor Eletrônicas.
 *
 * NFC-e utiliza a mesma biblioteca ACBrNFe (libacbrnfe64.so),
 * porém com configurações específicas (modelo 65, CSC obrigatório).
 */

export interface NfceServiceStatus {
  status: 'UP' | 'DOWN' | 'MAINTENANCE';
  message: string;
  uf: string;
  timestamp: Date;
}

export interface NfceEmissionResult {
  success: boolean;
  accessKey?: string;
  protocol?: string;
  xml?: string;
  xmlPath?: string;
  pdfPath?: string;
  /** QR Code obrigatório para NFCe (impressora térmica) */
  qrCode?: string;
  qrCodeUrl?: string;
  message?: string;
}

export interface NfceCancellationResult {
  success: boolean;
  protocol?: string;
  message?: string;
  xml?: string;
}

export interface INfceProvider {
  /** Inicializar a biblioteca ACBr para NFCe */
  inicializar(): Promise<void>;

  /** Finalizar e liberar recursos */
  finalizar(): Promise<void>;

  /** Verificar status do serviço na SEFAZ */
  checkStatus(uf: string, cnpj: string): Promise<NfceServiceStatus>;

  /** Emitir NFCe (Modelo 65) */
  emitir(json: any, issuer?: any): Promise<NfceEmissionResult>;

  /** Cancelar NFCe autorizada */
  cancelar(
    accessKey: string,
    justificativa: string,
    issuer: any,
  ): Promise<NfceCancellationResult>;

  /** Inutilizar faixa de numeração de NFCe */
  inutilizar(
    serie: number,
    numInicial: number,
    numFinal: number,
    justificativa: string,
    issuer: any,
  ): Promise<NfceCancellationResult>;
}
