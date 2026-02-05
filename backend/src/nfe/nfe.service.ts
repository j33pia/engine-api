import { Injectable } from '@nestjs/common';
import { CreateNfeDto } from './dto/create-nfe.dto';
import { UpdateNfeDto } from './dto/update-nfe.dto';
import { PrismaService } from '../prisma/prisma.service';
import { AcbrWrapperService } from './acbr-wrapper.service';
import { WebhookService } from '../partners/webhook.service';
// import { ACBrLibNFe } from '@projetoacbr/acbrlib-nfe-node';

@Injectable()
export class NfeService {
  constructor(
    private prisma: PrismaService,
    private acbrService: AcbrWrapperService,
    private webhookService: WebhookService,
  ) {}

  async emitirNfe(dadosNota: any) {
    // 1. Validar Tenant (Issuer) e Certificado
    // Em producao, isso viria do PartnerAuthGuard ou do User Context
    // Para este MVP, pegamos o primeiro (simulando que é a Padaria criada pelo admin)
    const issuer = await this.prisma.issuer.findFirst({
      include: { partner: true },
    });

    if (!issuer) {
      throw new Error('Nenhum Emissor configurado. Crie uma empresa primeiro.');
    }

    // --- LÓGICA BIG DATA: HARVESTING ---

    // A. Upsert Customer (Dona Maria)
    // Se ela já comprou antes, atualiza. Se não, cria.
    const customer = await this.prisma.customer.upsert({
      where: {
        issuerId_document: {
          issuerId: issuer.id,
          document: dadosNota.destCNPJ,
        },
      },
      update: {
        name: dadosNota.destName,
        // Aqui poderíamos atualizar endereço, email, etc se viesse no payload
      },
      create: {
        issuerId: issuer.id,
        document: dadosNota.destCNPJ,
        name: dadosNota.destName,
        // Defaults
        city: 'São Paulo',
        state: 'SP',
      },
    });

    // B. Upsert Products (Os Itens)
    if (dadosNota.items && Array.isArray(dadosNota.items)) {
      for (const item of dadosNota.items) {
        await this.prisma.product.upsert({
          where: {
            issuerId_code: {
              issuerId: issuer.id,
              code: item.code,
            },
          },
          update: {
            description: item.description,
            price: item.unitPrice, // Atualiza último preço praticado
            updatedAt: new Date(),
          },
          create: {
            issuerId: issuer.id,
            code: item.code,
            description: item.description,
            price: item.unitPrice,
            ean: item.ean || null,
            ncm: item.ncm || null,
            unit: 'UN',
          },
        });
      }
    }

    // --- LÓGICA BILLING: METERING ---
    // Incrementa o contador de uso do Partner (Software House)
    if (issuer.partnerId) {
      const currentPeriod = new Date().toISOString().slice(0, 7); // Ex: "2024-01"

      await this.prisma.usageMetric.upsert({
        where: {
          partnerId_period: {
            partnerId: issuer.partnerId,
            period: currentPeriod,
          },
        },
        update: {
          count: { increment: 1 },
        },
        create: {
          partnerId: issuer.partnerId,
          period: currentPeriod,
          count: 1,
        },
      });
    }

    // 2. Salvar Invoice no banco com status CREATED
    const invoice = await this.prisma.invoice.create({
      data: {
        issuerId: issuer.id,
        customerId: customer.id,
        number: Math.floor(Math.random() * 100000),
        series: dadosNota.serie || 1,
        amount: dadosNota.amount,
        destCNPJ: dadosNota.destCNPJ,
        destName: dadosNota.destName,
        status: 'CREATED',
        items: {
          create: (dadosNota.items || []).map((item: any) => ({
            itemCode: item.code,
            description: item.description,
            ean: item.ean,
            ncm: item.ncm,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
      },
    });

    // 3. Emitir via Provider (Real ACBrLib)
    console.log('[NfeService] Chamando acbrService.emitir...');
    const emission = await this.acbrService.emitir(dadosNota, issuer);
    console.log(
      '[NfeService] Emission result:',
      JSON.stringify(emission, null, 2),
    );

    // 4. Atualizar Invoice com resultado da emissão
    console.log(
      '[NfeService] Atualizando invoice:',
      invoice.id,
      'com accessKey:',
      emission.accessKey,
    );
    const updatedInvoice = await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        accessKey: emission.accessKey || null,
        status: emission.success ? 'AUTHORIZED' : 'ERROR',
        xmlPath: emission.accessKey
          ? `/app/xml/${emission.accessKey}-nfe.xml`
          : null,
        pdfPath: emission.pdfPath || null,
      },
    });
    console.log(
      '[NfeService] Invoice atualizada! accessKey salva:',
      updatedInvoice.accessKey,
    );

    return {
      status: emission.success ? 'AUTORIZADO' : 'ERRO',
      accessKey: updatedInvoice.accessKey,
      xml: emission.xml,
      invoiceId: updatedInvoice.id,
      protocol: emission.protocol,
      message: emission.message,
      pdfPath: emission.pdfPath,
    };
  }

  // Compatibilidade com Controller
  async create(createNfeDto: CreateNfeDto, issuerId: string) {
    // 1. Upsert Customer (Big Data)
    const customer = await this.prisma.customer.upsert({
      where: {
        issuerId_document: {
          issuerId: issuerId,
          document: createNfeDto.destCNPJ,
        },
      },
      update: { name: createNfeDto.destName },
      create: {
        issuerId: issuerId,
        document: createNfeDto.destCNPJ,
        name: createNfeDto.destName,
      },
    });

    // 2. Create Invoice Record
    const nfe = await this.prisma.invoice.create({
      data: {
        issuerId: issuerId,
        customerId: customer.id,
        number: Math.floor(Math.random() * 100000), // TODO: Sequence Control
        series: 1,
        amount: createNfeDto.amount,
        status: 'CREATED',
        destCNPJ: createNfeDto.destCNPJ, // Added
        destName: createNfeDto.destName, // Added
        items: {
          create: createNfeDto.items?.map((item) => ({
            itemCode: item.code,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            // Upsert Product Logic would go here in a real scenario or separate call
          })),
        },
      },
    });

    // 3. Emit via ACBr (Mock/Real)
    try {
      const issuer = await this.prisma.issuer.findUnique({
        where: { id: issuerId },
      });
      const emission = await this.acbrService.emitir(createNfeDto, issuer);

      if (emission.success) {
        const updatedInvoice = await this.prisma.invoice.update({
          where: { id: nfe.id },
          data: {
            status: 'AUTHORIZED',
            accessKey: emission.accessKey,
            xmlPath: emission.xmlPath,
            pdfPath: emission.pdfPath,
          },
          include: { customer: true, issuer: true },
        });

        // 4. Notify Partner via Webhook (Fire & Forget)
        // We need to resolve the Partner ID from the Issuer ID
        const issuer = await this.prisma.issuer.findUnique({
          where: { id: issuerId },
          select: { partnerId: true },
        });
        if (issuer?.partnerId) {
          this.webhookService.notifyInvoiceStatus(
            issuer.partnerId,
            updatedInvoice,
          );
        }

        return updatedInvoice;
      }
    } catch (error) {
      await this.prisma.invoice.update({
        where: { id: nfe.id },
        data: { status: 'ERROR' },
      });
      throw error;
    }

    return nfe;
  }

  async findAll() {
    return this.prisma.invoice.findMany({
      include: {
        issuer: true,
        fiscalEvents: {
          orderBy: { sequence: 'asc' },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.invoice.findUnique({ where: { id } });
  }

  async update(id: string, updateNfeDto: any) {
    return this.prisma.invoice.update({
      where: { id },
      data: updateNfeDto,
    });
  }

  async remove(id: string) {
    return this.prisma.invoice.delete({ where: { id } });
  }
}
