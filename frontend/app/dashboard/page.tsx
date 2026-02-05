"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Overview } from "@/components/dashboard/overview";
import { RecentSales } from "@/components/dashboard/recent-sales";
import { StatusChart } from "@/components/dashboard/status-chart";
import { CertAlert } from "@/components/dashboard/cert-alert";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Building2,
  AlertTriangle,
} from "lucide-react";

interface AnalyticsData {
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
    expiresAt: string;
    daysUntilExpiry: number;
    severity: "critical" | "warning" | "info";
  }[];
  recentActivity: {
    id: string;
    issuerName: string;
    amount: number;
    status: string;
    date: string;
  }[];
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [metrics, setMetrics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.accessToken) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/dashboard`, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setMetrics(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [session]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Dashboard Analytics
        </h2>
      </div>

      {/* Alertas de Certificado */}
      {metrics?.certAlerts && metrics.certAlerts.length > 0 && (
        <CertAlert alerts={metrics.certAlerts} />
      )}

      {/* KPI Cards - Primeira Linha */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor Total (Mês)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics?.operation?.totalValueMonth || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Em notas autorizadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Notas Emitidas
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              +{metrics?.billing?.totalNotes || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Ciclo Atual ({metrics?.billing?.period})
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Aprovação
            </CardTitle>
            {(metrics?.operation?.approvalRate || 0) >= 95 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${(metrics?.operation?.approvalRate || 0) >= 95 ? "text-green-600" : "text-amber-600"}`}
            >
              {metrics?.operation?.approvalRate?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">Meta: 95%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Custo Estimado
            </CardTitle>
            <span className="text-muted-foreground">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics?.billing?.estimatedCost || 0)}
            </div>
            <p className="text-xs text-muted-foreground">R$ 0,10 por nota</p>
          </CardContent>
        </Card>
      </div>

      {/* Segunda Linha - KPIs Secundários */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Empresas Ativas
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.operation?.activeIssuers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Clientes na sua base
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rejeições (Mês)
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${(metrics?.operation?.rejectionsMonth || 0) > 0 ? "text-red-600" : ""}`}
            >
              {metrics?.operation?.rejectionsMonth || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Notas negadas pela SEFAZ
            </p>
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusChart data={metrics?.invoicesByStatus || []} />
          </CardContent>
        </Card>
      </div>

      {/* Terceira Linha - Gráficos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Emissões por Período</CardTitle>
            <CardDescription>
              Valor total emitido nos últimos 30 dias
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview data={metrics?.invoicesByPeriod} />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Últimas Notas</CardTitle>
            <CardDescription>
              Atividade recente dos seus clientes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentSales data={metrics?.recentActivity} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
