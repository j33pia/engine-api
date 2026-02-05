import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateNfseDto } from './dto/create-nfse.dto';
import type { NfseProvider } from './providers/nfse-provider.interface';
import { NFSE_PROVIDER } from './providers/nfse-provider.interface';

@Injectable()
export class NfseService {
  private readonly logger = new Logger(NfseService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(NFSE_PROVIDER) private nfseProvider: NfseProvider,
  ) {}

  async emitNfse(dto: CreateNfseDto, partnerId: string) {
    this.logger.log(`Emitindo NFSe para issuer ${dto.issuerId}`);

    // Buscar emissor
    const issuer = await this.prisma.issuer.findFirst({
      where: { id: dto.issuerId, partnerId },
    });

    if (!issuer) {
      throw new NotFoundException('Empresa não encontrada');
    }

    // Configurar município
    await this.nfseProvider.configurarMunicipio(
      dto.servico.codigoMunicipio,
      issuer.certFilename || '',
      issuer.certPassword || '',
    );

    // Montar dados da NFSe
    const nfseData = {
      prestador: {
        cnpj: issuer.cnpj,
        inscricaoMunicipal: (issuer as any).inscricaoMunicipal || '',
        razaoSocial: issuer.name,
      },
      tomador: dto.tomador,
      servico: dto.servico,
    };

    // Emitir via provider
    const result = await this.nfseProvider.emitir(nfseData);

    if (!result.success) {
      throw new BadRequestException(result.error || 'Erro ao emitir NFSe');
    }

    // Salvar no banco
    const nfse = await this.prisma.nfse.create({
      data: {
        number: result.numero!,
        verificationCode: result.codigoVerificacao,
        status: 'AUTHORIZED',
        codigoMunicipio: dto.servico.codigoMunicipio,
        itemListaServico: dto.servico.itemListaServico,
        discriminacao: dto.servico.discriminacao,
        valorServicos: dto.servico.valorServicos,
        valorDeducoes: dto.servico.valorDeducoes,
        aliquotaIss: dto.servico.aliquotaIss,
        tomadorCnpjCpf: dto.tomador.cnpjCpf,
        tomadorRazao: dto.tomador.razaoSocial,
        xmlContent: result.xmlContent,
        issuerId: dto.issuerId,
        authorizedAt: result.dataEmissao,
      },
    });

    this.logger.log(`NFSe ${nfse.number} emitida com sucesso`);

    return {
      id: nfse.id,
      numero: nfse.number,
      codigoVerificacao: nfse.verificationCode,
      status: nfse.status,
      dataEmissao: nfse.authorizedAt,
      valorServicos: nfse.valorServicos,
    };
  }

  async listNfses(issuerId: string, partnerId: string) {
    // Verificar acesso
    const issuer = await this.prisma.issuer.findFirst({
      where: { id: issuerId, partnerId },
    });

    if (!issuer) {
      throw new NotFoundException('Empresa não encontrada');
    }

    return this.prisma.nfse.findMany({
      where: { issuerId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async listAllNfses(partnerId: string) {
    return this.prisma.nfse.findMany({
      where: {
        issuer: { partnerId },
      },
      include: {
        issuer: {
          select: { name: true, cnpj: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getNfseById(id: string, partnerId: string) {
    const nfse = await this.prisma.nfse.findFirst({
      where: {
        id,
        issuer: { partnerId },
      },
      include: {
        issuer: {
          select: { name: true, cnpj: true },
        },
      },
    });

    if (!nfse) {
      throw new NotFoundException('NFSe não encontrada');
    }

    return nfse;
  }

  async cancelNfse(id: string, motivo: string, partnerId: string) {
    const nfse = await this.getNfseById(id, partnerId);

    if (nfse.status === 'CANCELED') {
      throw new BadRequestException('NFSe já cancelada');
    }

    const result = await this.nfseProvider.cancelar(
      nfse.number,
      nfse.verificationCode || '',
      motivo,
    );

    if (!result.success) {
      throw new BadRequestException(result.error || 'Erro ao cancelar NFSe');
    }

    return this.prisma.nfse.update({
      where: { id },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
      },
    });
  }

  async downloadPdf(id: string, partnerId: string) {
    const nfse = await this.getNfseById(id, partnerId);

    if (!nfse.xmlContent) {
      throw new NotFoundException('XML da NFSe não disponível');
    }

    return this.nfseProvider.gerarPdf(nfse.xmlContent);
  }

  async downloadXml(id: string, partnerId: string) {
    const nfse = await this.getNfseById(id, partnerId);

    if (!nfse.xmlContent) {
      throw new NotFoundException('XML da NFSe não disponível');
    }

    return nfse.xmlContent;
  }
}
