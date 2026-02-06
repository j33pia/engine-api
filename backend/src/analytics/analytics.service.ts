import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsResponseDto } from './dto/analytics-response.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  async getDashboardMetrics(
    partnerId: string,
    issuerId?: string,
  ): Promise<AnalyticsResponseDto> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Buscar issuers do partner (filtrar por issuerId se fornecido)
    const issuerWhere = issuerId ? { partnerId, id: issuerId } : { partnerId };

    const issuers = await this.prisma.issuer.findMany({
      where: issuerWhere,
      select: { id: true, name: true, cnpj: true, certExpiry: true },
    });

    const issuerIds = issuers.map((i) => i.id);

    // Contar notas do mês
    const invoicesMonth = await this.prisma.invoice.findMany({
      where: {
        issuerId: { in: issuerIds },
        createdAt: { gte: startOfMonth },
      },
      select: {
        id: true,
        status: true,
        amount: true,
        createdAt: true,
        destName: true,
        issuer: { select: { name: true } },
      },
    });

    // Calcular métricas
    const totalNotes = invoicesMonth.length;
    const authorizedNotes = invoicesMonth.filter(
      (i) => i.status === 'AUTHORIZED',
    );
    const rejectedNotes = invoicesMonth.filter((i) => i.status === 'REJECTED');
    const approvalRate =
      totalNotes > 0 ? (authorizedNotes.length / totalNotes) * 100 : 0;
    const totalValueMonth = authorizedNotes.reduce(
      (sum, i) => sum + Number(i.amount),
      0,
    );

    // Custo estimado (R$ 0,10 por nota)
    const estimatedCost = totalNotes * 0.1;

    // Distribuição por status
    const statusCounts = invoicesMonth.reduce(
      (acc, inv) => {
        acc[inv.status] = (acc[inv.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const statusColors: Record<string, string> = {
      AUTHORIZED: '#22c55e',
      REJECTED: '#ef4444',
      CANCELED: '#6b7280',
      CREATED: '#3b82f6',
      ERROR: '#f97316',
    };

    const invoicesByStatus = Object.entries(statusCounts).map(
      ([status, count]) => ({
        status,
        count,
        color: statusColors[status] || '#888888',
      }),
    );

    // Notas por período (últimos 30 dias)
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const invoicesLast30 = await this.prisma.invoice.findMany({
      where: {
        issuerId: { in: issuerIds },
        createdAt: { gte: last30Days },
      },
      select: { createdAt: true, amount: true },
      orderBy: { createdAt: 'asc' },
    });

    // Agrupar por dia
    const byDay = invoicesLast30.reduce(
      (acc, inv) => {
        const date = inv.createdAt.toISOString().split('T')[0];
        if (!acc[date]) acc[date] = { count: 0, value: 0 };
        acc[date].count++;
        acc[date].value += Number(inv.amount);
        return acc;
      },
      {} as Record<string, { count: number; value: number }>,
    );

    const invoicesByPeriod = Object.entries(byDay).map(([date, data]) => ({
      date,
      count: data.count,
      value: data.value,
    }));

    // Alertas de certificados
    const certAlerts = issuers
      .filter((i) => i.certExpiry)
      .map((issuer) => {
        const expiresAt = new Date(issuer.certExpiry!);
        const daysUntilExpiry = Math.ceil(
          (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        let severity: 'critical' | 'warning' | 'info' = 'info';
        if (daysUntilExpiry <= 7) severity = 'critical';
        else if (daysUntilExpiry <= 15) severity = 'warning';
        else if (daysUntilExpiry <= 30) severity = 'info';
        else return null;

        return {
          issuerId: issuer.id,
          issuerName: issuer.name,
          cnpj: issuer.cnpj,
          expiresAt,
          daysUntilExpiry,
          severity,
        };
      })
      .filter(Boolean) as AnalyticsResponseDto['certAlerts'];

    // Atividade recente (últimas 10 notas)
    const recentInvoices = await this.prisma.invoice.findMany({
      where: { issuerId: { in: issuerIds } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { issuer: { select: { name: true } } },
    });

    const recentActivity = recentInvoices.map((inv) => ({
      id: inv.id,
      issuerName: inv.issuer.name,
      amount: Number(inv.amount),
      status: inv.status,
      date: inv.createdAt.toISOString(),
    }));

    return {
      billing: {
        totalNotes,
        estimatedCost,
        period,
      },
      operation: {
        activeIssuers: issuers.length,
        rejectionsMonth: rejectedNotes.length,
        approvalRate: Math.round(approvalRate * 100) / 100,
        totalValueMonth,
      },
      invoicesByStatus,
      invoicesByPeriod,
      certAlerts,
      recentActivity,
    };
  }

  async getInvoicesByPeriod(partnerId: string, days: number = 30) {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const issuers = await this.prisma.issuer.findMany({
      where: { partnerId },
      select: { id: true },
    });

    const issuerIds = issuers.map((i) => i.id);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        issuerId: { in: issuerIds },
        createdAt: { gte: startDate },
      },
      select: { createdAt: true, amount: true, status: true },
      orderBy: { createdAt: 'asc' },
    });

    // Agrupar por dia
    const byDay = invoices.reduce(
      (acc, inv) => {
        const date = inv.createdAt.toISOString().split('T')[0];
        if (!acc[date]) acc[date] = { count: 0, value: 0, authorized: 0 };
        acc[date].count++;
        acc[date].value += Number(inv.amount);
        if (inv.status === 'AUTHORIZED') acc[date].authorized++;
        return acc;
      },
      {} as Record<
        string,
        { count: number; value: number; authorized: number }
      >,
    );

    return Object.entries(byDay).map(([date, data]) => ({
      date,
      ...data,
    }));
  }
}
