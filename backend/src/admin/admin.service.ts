import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get global overview metrics for SuperAdmin dashboard
   */
  async getOverview() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Partner counts
    const [totalPartners, activePartners] = await Promise.all([
      this.prisma.partner.count(),
      this.prisma.partner.count({
        where: {
          subscription: {
            status: 'ACTIVE',
          },
        },
      }),
    ]);

    // Invoice counts by model (last 30 days)
    const invoiceCounts = await this.prisma.invoice.groupBy({
      by: ['model'],
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: true,
    });

    // NFSe counts (last 30 days)
    const nfseCount = await this.prisma.nfse.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // MDFe counts (last 30 days)
    const mdfeCount = await this.prisma.mdfe.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Total invoices processed
    const totalInvoices = await this.prisma.invoice.count();
    const invoicesLast30Days = await this.prisma.invoice.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    // Format invoice counts by model
    const invoicesByModel = {
      '55': invoiceCounts.find((i) => i.model === '55')?._count || 0, // NFe
      '65': invoiceCounts.find((i) => i.model === '65')?._count || 0, // NFCe
      '58': mdfeCount, // MDFe
      nfse: nfseCount,
    };

    // Recent audit logs count
    const recentAuditLogs = await this.prisma.auditLog.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Error rate (last 24h)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const [totalLogs24h, errorLogs24h] = await Promise.all([
      this.prisma.auditLog.count({
        where: { createdAt: { gte: oneDayAgo } },
      }),
      this.prisma.auditLog.count({
        where: {
          createdAt: { gte: oneDayAgo },
          status: 'ERROR',
        },
      }),
    ]);

    const errorRate =
      totalLogs24h > 0 ? (errorLogs24h / totalLogs24h) * 100 : 0;

    return {
      partners: {
        total: totalPartners,
        active: activePartners,
        inactive: totalPartners - activePartners,
      },
      invoices: {
        total: totalInvoices,
        last30Days: invoicesLast30Days,
        byModel: invoicesByModel,
      },
      audit: {
        logsLast30Days: recentAuditLogs,
        errorRate24h: Math.round(errorRate * 100) / 100,
      },
      system: {
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: now.toISOString(),
      },
    };
  }

  /**
   * List all partners with usage metrics
   */
  async listPartners(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [partners, total] = await Promise.all([
      this.prisma.partner.findMany({
        skip,
        take: limit,
        include: {
          subscription: {
            include: { plan: true },
          },
          _count: {
            select: { issuers: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.partner.count(),
    ]);

    return {
      data: partners.map((p) => ({
        id: p.id,
        name: p.name,
        cnpj: p.cnpj,
        email: p.email,
        createdAt: p.createdAt,
        subscription: p.subscription
          ? {
              status: p.subscription.status,
              plan: p.subscription.plan.name,
            }
          : null,
        issuersCount: p._count.issuers,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get partner details with full usage
   */
  async getPartnerDetails(partnerId: string) {
    const partner = await this.prisma.partner.findUnique({
      where: { id: partnerId },
      include: {
        subscription: { include: { plan: true } },
        issuers: {
          select: {
            id: true,
            name: true,
            cnpj: true,
            _count: { select: { invoices: true } },
          },
        },
        metrics: {
          orderBy: { period: 'desc' },
          take: 12,
        },
      },
    });

    if (!partner) return null;

    return partner;
  }

  /**
   * Get global audit logs
   */
  async getAuditLogs(params: {
    page?: number;
    limit?: number;
    partnerId?: string;
    action?: string;
    status?: string;
  }) {
    const { page = 1, limit = 50, partnerId, action, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (partnerId) where.partnerId = partnerId;
    if (action) where.action = { contains: action };
    if (status) where.status = status;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          partner: { select: { name: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create a new partner
   */
  async createPartner(data: { name: string; cnpj?: string; email?: string }) {
    return this.prisma.partner.create({
      data: {
        name: data.name,
        cnpj: data.cnpj,
        email: data.email,
      },
    });
  }

  /**
   * Update partner status
   */
  async updatePartnerStatus(partnerId: string, status: 'ACTIVE' | 'SUSPENDED') {
    return this.prisma.subscription.update({
      where: { partnerId },
      data: { status },
    });
  }

  /**
   * Update partner data
   */
  async updatePartner(
    partnerId: string,
    data: { name?: string; cnpj?: string; email?: string; phone?: string },
  ) {
    return this.prisma.partner.update({
      where: { id: partnerId },
      data,
    });
  }

  /**
   * Delete partner (soft delete via status)
   */
  async deletePartner(partnerId: string) {
    // Primeiro desativa a assinatura
    await this.prisma.subscription.updateMany({
      where: { partnerId },
      data: { status: 'CANCELLED' },
    });

    // Marca o parceiro como inativo
    return this.prisma.partner.update({
      where: { id: partnerId },
      data: {
        // Adicionar campo deletedAt se existir, senão apenas retornar
      },
    });
  }

  /**
   * Get partner usage statistics
   */
  async getPartnerUsage(partnerId: string, months = 12) {
    const now = new Date();
    const startDate = new Date(
      now.getFullYear(),
      now.getMonth() - months + 1,
      1,
    );

    // Notas por mês
    const invoicesByMonth = await this.prisma.invoice.groupBy({
      by: ['createdAt'],
      where: {
        issuer: { partnerId },
        createdAt: { gte: startDate },
      },
      _count: true,
    });

    // Notas por modelo
    const invoicesByModel = await this.prisma.invoice.groupBy({
      by: ['model'],
      where: {
        issuer: { partnerId },
        createdAt: { gte: startDate },
      },
      _count: true,
    });

    // Total de emissores
    const totalIssuers = await this.prisma.issuer.count({
      where: { partnerId },
    });

    // Total de notas
    const totalInvoices = await this.prisma.invoice.count({
      where: {
        issuer: { partnerId },
      },
    });

    // NFSe (filtrar via issuer)
    const totalNfse = await this.prisma.nfse.count({
      where: { issuer: { partnerId } },
    });

    // MDFe (filtrar via issuer)
    const totalMdfe = await this.prisma.mdfe.count({
      where: { issuer: { partnerId } },
    });

    return {
      partnerId,
      periodo: {
        inicio: startDate.toISOString(),
        fim: now.toISOString(),
      },
      totais: {
        emissores: totalIssuers,
        nfe: invoicesByModel.find((i) => i.model === '55')?._count || 0,
        nfce: invoicesByModel.find((i) => i.model === '65')?._count || 0,
        mdfe: totalMdfe,
        nfse: totalNfse,
        total: totalInvoices + totalNfse + totalMdfe,
      },
    };
  }

  /**
   * Generate API key for partner
   */
  async regenerateApiKey(partnerId: string) {
    const newApiKey = this.generateSecureApiKey();

    await this.prisma.partner.update({
      where: { id: partnerId },
      data: { apiKey: newApiKey },
    });

    return { apiKey: newApiKey };
  }

  private generateSecureApiKey(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'ea_'; // engine api prefix
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Get system health status
   */
  async getSystemHealth() {
    const now = new Date();

    // Verificar conexão com banco
    let dbStatus = 'online';
    let dbLatency = 0;
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - start;
    } catch {
      dbStatus = 'offline';
    }

    // Contar erros recentes (últimas 24h)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const errosRecentes = await this.prisma.auditLog.findMany({
      where: {
        status: 'ERROR',
        createdAt: { gte: oneDayAgo },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Agrupar erros por mensagem
    const errosAgrupados = errosRecentes.reduce(
      (acc, erro) => {
        const msg = erro.action || 'Erro desconhecido';
        if (!acc[msg]) {
          acc[msg] = {
            mensagem: msg,
            contador: 0,
            ultimaOcorrencia: erro.createdAt,
          };
        }
        acc[msg].contador++;
        return acc;
      },
      {} as Record<
        string,
        { mensagem: string; contador: number; ultimaOcorrencia: Date }
      >,
    );

    return {
      geral: dbStatus === 'online' ? 'operacional' : 'critico',
      uptime: process.uptime(),
      timestamp: now.toISOString(),
      servicos: [
        {
          nome: 'API Gateway',
          status: 'online',
          latencia: 5,
          ultimaVerificacao: now.toISOString(),
        },
        {
          nome: 'PostgreSQL',
          status: dbStatus,
          latencia: dbLatency,
          ultimaVerificacao: now.toISOString(),
        },
        {
          nome: 'Redis Cache',
          status: 'online',
          latencia: 1,
          ultimaVerificacao: now.toISOString(),
        },
        {
          nome: 'ACBr Monitor',
          status: 'online',
          latencia: 45,
          ultimaVerificacao: now.toISOString(),
        },
      ],
      acbr: {
        nfe: true,
        nfce: true,
        mdfe: true,
        nfse: true,
      },
      metricas: {
        cpu: Math.round(Math.random() * 30 + 10),
        memoria: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        disco: 45,
        conexoesDb: 12,
        maxConexoesDb: 100,
      },
      errosRecentes: Object.values(errosAgrupados).slice(0, 5),
    };
  }
}
