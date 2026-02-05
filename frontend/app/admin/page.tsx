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
} from "lucide-react";

interface DadosResumo {
  parceiros: {
    total: number;
    ativos: number;
    inativos: number;
  };
  notas: {
    total: number;
    ultimos30Dias: number;
    porModelo: {
      "55": number;
      "65": number;
      "58": number;
      nfse: number;
    };
  };
  auditoria: {
    logsUltimos30Dias: number;
    taxaErro24h: number;
  };
  sistema: {
    status: string;
    uptime: number;
    timestamp: string;
  };
}

export default function PaginaVisaoGeral() {
  const [dados, setDados] = useState<DadosResumo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Substituir por chamada real à API
    const dadosMock: DadosResumo = {
      parceiros: { total: 12, ativos: 10, inativos: 2 },
      notas: {
        total: 45230,
        ultimos30Dias: 3420,
        porModelo: { "55": 2100, "65": 890, "58": 230, nfse: 200 },
      },
      auditoria: { logsUltimos30Dias: 15420, taxaErro24h: 0.5 },
      sistema: {
        status: "operacional",
        uptime: 864000,
        timestamp: new Date().toISOString(),
      },
    };

    setTimeout(() => {
      setDados(dadosMock);
      setCarregando(false);
    }, 500);
  }, []);

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
      </div>
    );
  }

  if (erro) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        <AlertCircle className="mr-2" /> {erro}
      </div>
    );
  }

  const formatarUptime = (segundos: number) => {
    const dias = Math.floor(segundos / 86400);
    const horas = Math.floor((segundos % 86400) / 3600);
    return `${dias}d ${horas}h`;
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Visão Geral</h1>
          <p className="text-muted-foreground">
            Painel de operações da plataforma EngineAPI
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="h-4 w-4 text-green-500" />
          Sistema: {dados?.sistema.status}
        </div>
      </div>

      {/* Cards de KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Parceiros */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parceiros</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dados?.parceiros.total}</div>
            <p className="text-xs text-muted-foreground">
              {dados?.parceiros.ativos} ativos, {dados?.parceiros.inativos}{" "}
              inativos
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
              {dados?.notas.ultimos30Dias.toLocaleString("pt-BR")}
            </div>
            <p className="text-xs text-muted-foreground">
              Total: {dados?.notas.total.toLocaleString("pt-BR")}
            </p>
          </CardContent>
        </Card>

        {/* Logs de Auditoria */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Logs de Auditoria
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dados?.auditoria.logsUltimos30Dias.toLocaleString("pt-BR")}
            </div>
            <p className="text-xs text-muted-foreground">
              Taxa de erro: {dados?.auditoria.taxaErro24h}%
            </p>
          </CardContent>
        </Card>

        {/* Sistema */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Ativo</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dados?.sistema.uptime
                ? formatarUptime(dados.sistema.uptime)
                : "-"}
            </div>
            <p className="text-xs text-muted-foreground">Sistema operacional</p>
          </CardContent>
        </Card>
      </div>

      {/* Notas por Modelo */}
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
                  {dados?.notas.porModelo["55"].toLocaleString("pt-BR")}
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
                  {dados?.notas.porModelo["65"].toLocaleString("pt-BR")}
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
                  {dados?.notas.porModelo["58"].toLocaleString("pt-BR")}
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
                  {dados?.notas.porModelo.nfse.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
