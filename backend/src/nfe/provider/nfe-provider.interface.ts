export interface ServiceStatus {
  status: 'UP' | 'DOWN' | 'MAINTENANCE';
  message: string;
  uf: string;
  timestamp: Date;
}

export interface EmissionResult {
  success: boolean;
  accessKey?: string;
  protocol?: string;
  xml?: string;
  xmlPath?: string;
  pdfPath?: string;
  pdfUrl?: string;
  message?: string;
}

export interface CancellationResult {
  success: boolean;
  protocol?: string;
  message?: string;
  xml?: string;
}

export interface CcEResult {
  success: boolean;
  protocol?: string;
  sequence?: number;
  message?: string;
  xml?: string;
}

export interface NfceEmissionResult extends EmissionResult {
  qrCode?: string; // QR Code para NFCe
}

export interface INfeProvider {
  inicializar(): Promise<void>;
  finalizar(): Promise<void>;
  checkStatus(uf: string, cnpj: string): Promise<ServiceStatus>;
  emitir(json: any, issuer?: any): Promise<EmissionResult>;
  emitirNfce(json: any, issuer?: any): Promise<NfceEmissionResult>;
  cancelar(
    accessKey: string,
    justificativa: string,
    issuer: any,
  ): Promise<CancellationResult>;
  enviarCartaCorrecao(
    accessKey: string,
    correcao: string,
    sequencia: number,
    issuer: any,
  ): Promise<CcEResult>;

  // MDFe (Modelo 58)
  emitirMdfe(json: any, issuer?: any): Promise<EmissionResult>;
  encerrarMdfe(
    accessKey: string,
    ufEncerramento: string,
    issuer?: any,
  ): Promise<CancellationResult>;
}
