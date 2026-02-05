export class AnalyticsResponseDto {
  billing: {
    totalNotes: number;
    estimatedCost: number;
    period: string;
  };

  operation: {
    activeIssuers: number;
    rejectionsMonth: number;
    approvalRate: number;
    totalValueMonth: number;
  };

  invoicesByStatus: {
    status: string;
    count: number;
    color: string;
  }[];

  invoicesByPeriod: {
    date: string;
    count: number;
    value: number;
  }[];

  certAlerts: {
    issuerId: string;
    issuerName: string;
    cnpj: string;
    expiresAt: Date;
    daysUntilExpiry: number;
    severity: 'critical' | 'warning' | 'info';
  }[];

  recentActivity: {
    id: string;
    issuerName: string;
    amount: number;
    status: string;
    date: string;
  }[];
}
