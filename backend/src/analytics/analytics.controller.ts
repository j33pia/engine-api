import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('📊 Analytics')
@ApiBearerAuth('JWT-auth')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({
    summary: 'Dashboard completo',
    description: `
Retorna todas as métricas do dashboard do parceiro:

- **Billing**: Notas emitidas, custo estimado, período
- **Operation**: Empresas ativas, rejeições, taxa aprovação, valor total
- **invoicesByStatus**: Distribuição por status (para pie chart)
- **invoicesByPeriod**: Emissões por dia (para bar chart)
- **certAlerts**: Certificados expirando em 30 dias
- **recentActivity**: Últimas 10 notas emitidas
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas retornadas com sucesso',
    schema: {
      example: {
        billing: { totalNotes: 150, estimatedCost: 15.0, period: '2026-02' },
        operation: {
          activeIssuers: 5,
          rejectionsMonth: 2,
          approvalRate: 98.5,
          totalValueMonth: 125000.0,
        },
        invoicesByStatus: [
          { status: 'AUTHORIZED', count: 120, color: '#22c55e' },
          { status: 'REJECTED', count: 2, color: '#ef4444' },
        ],
        invoicesByPeriod: [{ date: '2026-02-01', count: 15, value: 5000.0 }],
        certAlerts: [],
        recentActivity: [],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async getDashboard(@Request() req: any) {
    return this.analyticsService.getDashboardMetrics(req.user.partnerId);
  }

  @Get('invoices-by-period')
  @ApiOperation({
    summary: 'Notas por período',
    description:
      'Retorna contagem e valor de notas agrupados por dia. Útil para gráficos temporais.',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Número de dias (padrão: 30)',
    example: 30,
  })
  @ApiResponse({
    status: 200,
    description: 'Dados por período',
    schema: {
      example: [
        { date: '2026-02-01', count: 15, value: 5000.0, authorized: 14 },
        { date: '2026-02-02', count: 22, value: 8500.0, authorized: 21 },
      ],
    },
  })
  async getInvoicesByPeriod(@Request() req: any, @Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.analyticsService.getInvoicesByPeriod(
      req.user.partnerId,
      daysNum,
    );
  }
}
