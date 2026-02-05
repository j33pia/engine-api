"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building2,
  FileText,
  Activity,
  AlertCircle,
  TrendingUp,
  Users,
} from "lucide-react";

interface OverviewData {
  partners: {
    total: number;
    active: number;
    inactive: number;
  };
  invoices: {
    total: number;
    last30Days: number;
    byModel: {
      "55": number;
      "65": number;
      "58": number;
      nfse: number;
    };
  };
  audit: {
    logsLast30Days: number;
    errorRate24h: number;
  };
  system: {
    status: string;
    uptime: number;
    timestamp: string;
  };
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Replace with actual API call when auth is ready
    // For now, using mock data
    const mockData: OverviewData = {
      partners: { total: 12, active: 10, inactive: 2 },
      invoices: {
        total: 45230,
        last30Days: 3420,
        byModel: { "55": 2100, "65": 890, "58": 230, nfse: 200 },
      },
      audit: { logsLast30Days: 15420, errorRate24h: 0.5 },
      system: {
        status: "healthy",
        uptime: 864000,
        timestamp: new Date().toISOString(),
      },
    };

    setTimeout(() => {
      setData(mockData);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        <AlertCircle className="mr-2" /> {error}
      </div>
    );
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SuperAdmin Overview</h1>
          <p className="text-muted-foreground">
            Visão geral da plataforma EngineAPI
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="h-4 w-4 text-green-500" />
          Sistema: {data?.system.status}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Partners */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partners</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.partners.total}</div>
            <p className="text-xs text-muted-foreground">
              {data?.partners.active} ativos, {data?.partners.inactive} inativos
            </p>
          </CardContent>
        </Card>

        {/* Notas Emitidas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notas (30d)</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.invoices.last30Days.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total: {data?.invoices.total.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Audit Logs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audit Logs</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.audit.logsLast30Days.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Error rate: {data?.audit.errorRate24h}%
            </p>
          </CardContent>
        </Card>

        {/* System */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.system.uptime ? formatUptime(data.system.uptime) : "-"}
            </div>
            <p className="text-xs text-muted-foreground">Sistema operacional</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices by Model */}
      <Card>
        <CardHeader>
          <CardTitle>Notas por Modelo (últimos 30 dias)</CardTitle>
          <CardDescription>
            Distribuição por tipo de documento fiscal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center gap-4 rounded-lg border p-4">
              <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">NFe (55)</p>
                <p className="text-xl font-bold">
                  {data?.invoices.byModel["55"].toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-lg border p-4">
              <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">NFCe (65)</p>
                <p className="text-xl font-bold">
                  {data?.invoices.byModel["65"].toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-lg border p-4">
              <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">MDFe (58)</p>
                <p className="text-xl font-bold">
                  {data?.invoices.byModel["58"].toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-lg border p-4">
              <div className="rounded-full bg-orange-100 p-2 dark:bg-orange-900">
                <FileText className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">NFSe</p>
                <p className="text-xl font-bold">
                  {data?.invoices.byModel.nfse.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
