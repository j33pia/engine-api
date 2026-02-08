import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NfceWrapperService } from './nfce-wrapper.service';
import { CreateNfceDto } from './dto/create-nfce.dto';

/**
 * Serviço de NFCe (Modelo 65)
 *
 * Gerencia a emissão de Notas Fiscais de Consumidor Eletrônicas
 * utilizando o NfceWrapperService independente.
 */
@Injectable()
export class NfceService {
  private readonly logger = new Logger(NfceService.name);

  constructor(
    private prisma: PrismaService,
    private nfceWrapper: NfceWrapperService,
  ) {}

  /**
   * Emitir NFCe (Modelo 65)
   * Cria registro no banco, emite via ACBr e atualiza com resultado
   */
  async emitir(createNfceDto: CreateNfceDto, issuerId: string) {
    this.logger.log(`[NFCe] Iniciando emissão para issuer: ${issuerId}`);

    // Buscar Issuer com dados completos
    const issuer = await this.prisma.issuer.findUnique({
      where: { id: issuerId },
    });

    if (!issuer) {
      throw new Error('Emissor não encontrado');
    }

    // Verificar se tem CSC configurado (obrigatório para NFCe)
    if (!issuer.csc || !issuer.cscId) {
      this.logger.warn('[NFCe] CSC não configurado - usando mock');
    }

    // Calcular total
    const totalAmount = createNfceDto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    // Buscar próximo número (série 1 por padrão para NFCe)
    const lastInvoice = await this.prisma.invoice.findFirst({
      where: { issuerId, model: '65' },
      orderBy: { number: 'desc' },
    });
    const nextNumber = (lastInvoice?.number || 0) + 1;
    const series = createNfceDto.series || 1;

    // Criar Invoice no banco
    const invoice = await this.prisma.invoice.create({
      data: {
        issuerId,
        number: createNfceDto.number || nextNumber,
        series,
        model: '65', // NFCe = Modelo 65
        amount: totalAmount,
        destCNPJ: createNfceDto.destCPF || null,
        destName: createNfceDto.destName || 'CONSUMIDOR FINAL',
        status: 'CREATED',
        items: {
          create: createNfceDto.items.map((item) => ({
            itemCode: item.code,
            description: item.description,
            ean: item.ean || 'SEM GTIN',
            ncm: item.ncm || '00000000',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
      },
      include: { items: true },
    });

    this.logger.log(
      `[NFCe] Invoice criada: ${invoice.id}, número: ${invoice.number}`,
    );

    // Montar dados para emissão
    const dadosNfce = {
      ...createNfceDto,
      issuerId,
      modelo: '65',
      serie: series,
      numero: invoice.number,
      destCNPJ: createNfceDto.destCPF || '',
      destName: createNfceDto.destName || 'CONSUMIDOR FINAL',
      csc: issuer.csc,
      cscId: issuer.cscId,
    };

    // Emitir via NfceWrapper (Mock ou Real)
    const emission = await this.nfceWrapper.emitir(dadosNfce, issuer);

    // Atualizar Invoice com resultado
    const updatedInvoice = await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        accessKey: emission.accessKey || null,
        status: emission.success ? 'AUTHORIZED' : 'ERROR',
        xmlPath: emission.accessKey
          ? `/app/xml/nfce/${emission.accessKey}-nfce.xml`
          : null,
        pdfPath: emission.pdfPath || null,
      },
    });

    return {
      status: emission.success ? 'AUTORIZADO' : 'ERRO',
      accessKey: updatedInvoice.accessKey,
      xml: emission.xml,
      invoiceId: updatedInvoice.id,
      protocol: emission.protocol,
      message: emission.message,
      pdfPath: emission.pdfPath,
      qrCode: emission.qrCode,
    };
  }

  async findAll(issuerId?: string) {
    return this.prisma.invoice.findMany({
      where: {
        model: '65', // Apenas NFCe
        ...(issuerId && { issuerId }),
      },
      include: { issuer: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.invoice.findFirst({
      where: { id, model: '65' },
      include: { issuer: true, items: true },
    });
  }
}
