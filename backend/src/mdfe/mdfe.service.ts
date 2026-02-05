import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AcbrWrapperService } from '../nfe/acbr-wrapper.service';
import { CreateMdfeDto } from './dto/create-mdfe.dto';

@Injectable()
export class MdfeService {
  private readonly logger = new Logger(MdfeService.name);

  constructor(
    private prisma: PrismaService,
    private acbrService: AcbrWrapperService,
  ) {}

  /**
   * Emitir MDFe (Manifesto Eletrônico de Documentos Fiscais)
   */
  async emitir(createMdfeDto: CreateMdfeDto, issuerId: string) {
    this.logger.log('📦 Iniciando emissão de MDFe...');

    // Buscar emissor
    const issuer = await this.prisma.issuer.findUnique({
      where: { id: issuerId },
    });

    if (!issuer) {
      throw new NotFoundException('Emissor não encontrado');
    }

    // Calcular próximo número
    const lastMdfe = await this.prisma.mdfe.findFirst({
      where: { issuerId },
      orderBy: { number: 'desc' },
    });
    const nextNumber = (lastMdfe?.number || 0) + 1;
    const series = createMdfeDto.series || 1;

    // Contar documentos
    const qNFe = createMdfeDto.documentos.filter((d) => d.tpDoc === '1').length;
    const qCTe = createMdfeDto.documentos.filter((d) => d.tpDoc === '2').length;

    // Criar registro MDFe
    const mdfe = await this.prisma.mdfe.create({
      data: {
        number: nextNumber,
        series: series,
        ufStart: createMdfeDto.ufStart,
        ufEnd: createMdfeDto.ufEnd,
        dtViagem: new Date(createMdfeDto.dtViagem),
        placaVeiculo: createMdfeDto.placaVeiculo.toUpperCase().replace('-', ''),
        renavam: createMdfeDto.renavam,
        tara: createMdfeDto.tara,
        capKg: createMdfeDto.capKg,
        capM3: createMdfeDto.capM3,
        cpfMotorista: createMdfeDto.cpfMotorista.replace(/\D/g, ''),
        nomeMotorista: createMdfeDto.nomeMotorista,
        documentos: createMdfeDto.documentos as any,
        qNFe,
        qCTe,
        vCarga: createMdfeDto.vCarga || 0,
        issuerId,
      },
    });

    // Preparar dados para ACBr
    const dadosMdfe = {
      modelo: '58',
      serie: series,
      numero: nextNumber,
      ufIni: createMdfeDto.ufStart,
      ufFim: createMdfeDto.ufEnd,
      dhViagem: createMdfeDto.dtViagem,
      veicTracao: {
        placa: createMdfeDto.placaVeiculo.toUpperCase().replace('-', ''),
        renavam: createMdfeDto.renavam,
        tara: createMdfeDto.tara,
        capKg: createMdfeDto.capKg,
        capM3: createMdfeDto.capM3,
        condutor: {
          cpf: createMdfeDto.cpfMotorista.replace(/\D/g, ''),
          nome: createMdfeDto.nomeMotorista,
        },
      },
      infDoc: {
        infMunDescarga: createMdfeDto.documentos.map((doc) => ({
          chNFe: doc.chNFe,
          tpDoc: doc.tpDoc,
        })),
      },
      tot: {
        qNFe,
        qCTe,
        vCarga: createMdfeDto.vCarga || 0,
      },
    };

    try {
      // Emitir via ACBr wrapper
      const emission = await this.acbrService.emitirMdfe(dadosMdfe, issuer);

      // Atualizar MDFe com resultado
      const updatedMdfe = await this.prisma.mdfe.update({
        where: { id: mdfe.id },
        data: {
          accessKey: emission.accessKey,
          protocol: emission.protocol,
          status: emission.success ? 'AUTHORIZED' : 'REJECTED',
          xmlPath: emission.xmlPath,
          pdfPath: emission.pdfPath,
        },
      });

      this.logger.log(`✅ MDFe ${nextNumber} emitida: ${emission.accessKey}`);

      return {
        success: emission.success,
        mdfeId: updatedMdfe.id,
        number: nextNumber,
        series,
        accessKey: emission.accessKey,
        protocol: emission.protocol,
        status: updatedMdfe.status,
        message: emission.success
          ? 'MDFe autorizado com sucesso'
          : emission.message,
      };
    } catch (error: any) {
      this.logger.error(`❌ Erro na emissão MDFe: ${error.message}`);

      await this.prisma.mdfe.update({
        where: { id: mdfe.id },
        data: { status: 'REJECTED' },
      });

      throw error;
    }
  }

  /**
   * Listar MDFes
   */
  async findAll(issuerId?: string) {
    const where = issuerId ? { issuerId } : {};
    return this.prisma.mdfe.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Buscar MDFe por ID
   */
  async findOne(id: string) {
    const mdfe = await this.prisma.mdfe.findUnique({
      where: { id },
      include: { issuer: true },
    });

    if (!mdfe) {
      throw new NotFoundException('MDFe não encontrado');
    }

    return mdfe;
  }

  /**
   * Encerrar MDFe
   */
  async encerrar(accessKey: string, ufEncerramento: string, issuerId: string) {
    const mdfe = await this.prisma.mdfe.findFirst({
      where: { accessKey, issuerId },
    });

    if (!mdfe) {
      throw new NotFoundException('MDFe não encontrado');
    }

    if (mdfe.status !== 'AUTHORIZED') {
      throw new Error('Apenas MDFe autorizado pode ser encerrado');
    }

    const issuer = await this.prisma.issuer.findUnique({
      where: { id: issuerId },
    });

    // Encerrar via ACBr
    const result = await this.acbrService.encerrarMdfe(
      accessKey,
      ufEncerramento,
      issuer,
    );

    if (result.success) {
      await this.prisma.mdfe.update({
        where: { id: mdfe.id },
        data: {
          status: 'CLOSED',
          dtEncerramento: new Date(),
          ufEncerramento,
        },
      });
    }

    return result;
  }
}
